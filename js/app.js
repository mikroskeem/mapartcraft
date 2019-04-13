var mapsize = [1, 1];
var selectedblocks = [];
var selectedcolors = [];
var filename = "mapart";
var img = new Image();

function initialize() {
    let colorid = 0;
    window.blocklist.forEach(function(i) {
        blockid = 0;
        document.getElementById('blockselection').innerHTML += '<br><div class="colorbox" style="background: linear-gradient(' + cssrgb(i[0][0]) + ',' + cssrgb(i[0][1]) + ',' + cssrgb(i[0][2]) + ');"></div><label><input type="radio" name="color' + colorid + '" value="-1" onclick="updateMap()" checked><img src="img/barrier.png" alt="None" data-tooltip title="None"></label>';
        i[1].forEach(function(j) {
            let imgfile = j[4]
            if (j[4] == "")
                imgfile = j[0]
            document.getElementById('blockselection').innerHTML += '<label><input type="radio" name="color' + colorid + '" value="' + blockid + '" onclick="updateMap()"><img src="img/' + imgfile + '.png" alt="' + j[2] + '" data-tooltip title="' + j[2] + '"></label>';
            blockid++;
        });
        colorid++;
    });
    tooltip.refresh();
    document.getElementById('imgupload').addEventListener('change', loadImg);
    img.src = "img/upload.png";
    img.onload = function() {
        updateMap();
    }
}

function updateMap() {
    selectedblocks = [];
    selectedcolors = [];
    for (let i = 0; i < 51; i++) {
        blockid = document.querySelector('input[name="color' + i + '"]:checked').value;
        if (blockid == -1) {
            continue
        }
        selectedblocks.push([i, parseInt(blockid)]);
        // gotta add 2D/3D support here
        if (document.getElementById('staircasing').checked) {
            selectedcolors.push(window.blocklist[i][0][0]);
            selectedcolors.push(window.blocklist[i][0][2]);
        }
        selectedcolors.push(window.blocklist[i][0][1]);
    }
    mapsize = [document.getElementById('mapsizex').value, document.getElementById('mapsizey').value]
    var canvas = document.getElementById('canvas');
    var ctx = document.getElementById('canvas').getContext('2d');
    var upsctx = document.getElementById('displaycanvas').getContext('2d');
    ctx.canvas.width = mapsize[0] * 128;
    ctx.canvas.height = mapsize[1] * 128;
    document.getElementById('mapres').innerHTML = ctx.canvas.width + "x" + ctx.canvas.height;
    document.getElementById('mapreswarning').innerHTML = img.width + "x" + img.height;
    if (img.width / img.height == ctx.canvas.width / ctx.canvas.height) {
        document.getElementById('mapreswarning').style = "color:red; display: none";
    } else {
        document.getElementById('mapreswarning').style = "color:red; display: inline";
    }
    if (mapsize[0] < 4 && mapsize[1] < 8) {
        upsctx.canvas.width = ctx.canvas.width * 2;
        upsctx.canvas.height = ctx.canvas.height * 2;
    } else {
        upsctx.canvas.width = ctx.canvas.width;
        upsctx.canvas.height = ctx.canvas.height;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < imgData.data.length; i += 4) {
        //i = r, i+1 = g, i+2 = b, i+3 = a
        imgData.data[i + 3] = 255; // remove alpha
        switch (document.getElementById("dither").selectedIndex) {
            case 0: // no dither
                newpixel = find_closest([imgData.data[i], imgData.data[i + 1], imgData.data[i + 2]])
                imgData.data[i + 0] = newpixel[0];
                imgData.data[i + 1] = newpixel[1];
                imgData.data[i + 2] = newpixel[2];
                break;
            case 1: // floyd
                oldpixel = [imgData.data[i], imgData.data[i + 1], imgData.data[i + 2]];
                newpixel = find_closest(oldpixel);
                quant_error = [];
                for (var j = 0; j <= 3; j++) {
                    quant_error.push(oldpixel[j] - newpixel[j]);
                }

                imgData.data[i + 0] = newpixel[0];
                imgData.data[i + 1] = newpixel[1];
                imgData.data[i + 2] = newpixel[2];

                try {
                    imgData.data[i + 4] += (quant_error[0] * 7 / 16);
                    imgData.data[i + 5] += (quant_error[1] * 7 / 16);
                    imgData.data[i + 6] += (quant_error[2] * 7 / 16);
                    imgData.data[i + canvas.width * 4 - 4] += (quant_error[0] * 3 / 16);
                    imgData.data[i + canvas.width * 4 - 3] += (quant_error[1] * 3 / 16);
                    imgData.data[i + canvas.width * 4 - 2] += (quant_error[2] * 3 / 16);
                    imgData.data[i + canvas.width * 4 + 0] += (quant_error[0] * 5 / 16);
                    imgData.data[i + canvas.width * 4 + 1] += (quant_error[1] * 5 / 16);
                    imgData.data[i + canvas.width * 4 + 2] += (quant_error[2] * 5 / 16);
                    imgData.data[i + canvas.width * 4 + 4] += (quant_error[0] * 1 / 16);
                    imgData.data[i + canvas.width * 4 + 5] += (quant_error[1] * 1 / 16);
                    imgData.data[i + canvas.width * 4 + 6] += (quant_error[2] * 1 / 16);
                } catch (e) {
                    console.error(e);
                }

                break;
        }
        let x = (i / 4) % canvas.width;
        let y = ((i / 4) - x) / canvas.width;
        upsctx.fillStyle = "rgba(" + imgData.data[i + 0] + "," + imgData.data[i + 1] + "," + imgData.data[i + 2] + "," + 255 + ")";
        if (mapsize[0] < 4 && mapsize[1] < 8) {
            upsctx.fillRect(x * 2, y * 2, 2, 2);
        } else {
            upsctx.fillRect(x, y, 1, 1);
        }
    }
    ctx.putImageData(imgData, 0, 0);
}

function getNbt() {
    var ctx = document.getElementById('canvas').getContext('2d');
    var imgData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height);
    var blocks = []
    nbtblocklist = []
    let underblocks = document.getElementById("underblocks").selectedIndex;
    if (underblocks > 0) {
        let underblock = document.getElementById("underblock").value;
        nbtblocklist.push({
            "Colors": [-1, -1, -1],
            "Name": underblock
        });
    }
    for (let x = 0; x < ctx.canvas.width; x++) {
        for (let y = 0; y < ctx.canvas.height; y++) {
            color = [imgData.data[x * 4 + y * 4 * ctx.canvas.width], imgData.data[x * 4 + y * 4 * ctx.canvas.width + 1], imgData.data[x * 4 + y * 4 * ctx.canvas.width + 2]];
            selectedblocks.forEach(function(i) {
                if (arraysEqual(blocklist[i[0]][0][0], color) || arraysEqual(blocklist[i[0]][0][1], color) || arraysEqual(blocklist[i[0]][0][2], color)) {
                    if (blocklist[i[0]][1][i[1]][1] == "") {
                        toPush = {
                            "Colors": blocklist[i[0]][0],
                            "Name": "minecraft:" + blocklist[i[0]][1][i[1]][0]
                        };
                    } else {
                        toPush = {
                            "Colors": blocklist[i[0]][0],
                            "Name": "minecraft:" + blocklist[i[0]][1][i[1]][0],
                            "Properties": JSON.parse("{ " + blocklist[i[0]][1][i[1]][1].replace(/'/g, "\"") + " }")
                        };
                    }
                    try {
                        nbtblocklist.forEach(function(j) { //what the fuck even
                            if (arraysEqual(j["Colors"], toPush["Colors"])) {
                                toPush = null;
                                throw 69;
                            }
                        });
                    } catch (err) {}
                    if (toPush != null)
                        nbtblocklist.push(toPush);
                }
            });
        }
    }
    let maxheight = [0, 2];
    if (document.getElementById('staircasing').checked) { // 3D CODE
        for (let x = 0; x < ctx.canvas.width; x++) {

            let hhhh = 1000;
            let minh = 1000;
            let maxh = 1000;
            for (let y = 0; y < ctx.canvas.height; y++) {
                let color = [imgData.data[x * 4 + y * 4 * ctx.canvas.width], imgData.data[x * 4 + y * 4 * ctx.canvas.width + 1], imgData.data[x * 4 + y * 4 * ctx.canvas.width + 2]];
                let toneid = 0;
                for (let i = 0; i < nbtblocklist.length; i++) {
                    if (arraysEqual(nbtblocklist[i]["Colors"][0], color)) {
                        toneid = -1;
                        break;
                    }
                    if (arraysEqual(nbtblocklist[i]["Colors"][1], color)) {
                        toneid = 0;
                        break;
                    }
                    if (arraysEqual(nbtblocklist[i]["Colors"][2], color)) {
                        toneid = 1;
                        break;
                    }

                }
                hhhh += toneid;
                minh = Math.min(minh, hhhh);
                maxh = Math.max(maxh, hhhh);
            }
            maxheight = [Math.min(maxheight[0], minh), Math.max(maxheight[1], maxh + 2)];
            hhhh = 1000 - minh;
            hhhh += 2;
            for (let y = 0; y < ctx.canvas.height; y++) {
                let color = [imgData.data[x * 4 + y * 4 * ctx.canvas.width], imgData.data[x * 4 + y * 4 * ctx.canvas.width + 1], imgData.data[x * 4 + y * 4 * ctx.canvas.width + 2]];
                let toneid = 0;
                let blockid = 0;
                for (let i = 0; i < nbtblocklist.length; i++) {
                    if (arraysEqual(nbtblocklist[i]["Colors"][0], color)) {
                        toneid = -1;
                        blockid = i;
                        break;
                    }
                    if (arraysEqual(nbtblocklist[i]["Colors"][1], color)) {
                        toneid = 0;
                        blockid = i;
                        break;
                    }
                    if (arraysEqual(nbtblocklist[i]["Colors"][2], color)) {
                        toneid = 1;
                        blockid = i;
                        break;
                    }
                }
                if (y == 0) {
                    blocks.push({
                        "pos": [x, hhhh - toneid, y],
                        "state": 0
                    });
                }
                hhhh += toneid;
                blocks.push({
                    "pos": [x, hhhh, y + 1],
                    "state": blockid
                });
                console.log(hhhh);
                //UNDERBLOCKS
                if (underblocks == 2) {
                    blocks.push({
                        "pos": [x, hhhh - 1, y + 1],
                        "state": 0
                    });
                } else if (underblocks == 1) {
                    selectedblocks.forEach(function(b) {
                        if (arraysEqual(blocklist[b[0]][0][0], nbtblocklist[blockid]["Colors"][0])) {
                            if (blocklist[b[1]][1][3])
                                blocks.push({
                                    "pos": [x, hhhh - 1, y + 1],
                                    "state": 0
                                });
                        }
                    });
                }

            }
        }
    } else { // 2D CODE
        for (let x = 0; x < ctx.canvas.width; x++) {
            for (let y = 0; y < ctx.canvas.height; y++) {
                let color = [imgData.data[x * 4 + y * 4 * ctx.canvas.width], imgData.data[x * 4 + y * 4 * ctx.canvas.width + 1], imgData.data[x * 4 + y * 4 * ctx.canvas.width + 2]];
                let blockid = 0;
                for (let i = 0; i < nbtblocklist.length; i++) {
                    if (arraysEqual(nbtblocklist[i]["Colors"][1], color)) {
                        blockid = i;
                        break;
                    }
                }
                blocks.push({
                    "pos": [x, 1, y + 1],
                    "state": blockid
                });

                // UNDERBLOCKS
                if (underblocks == 2) {
                    blocks.push({
                        "pos": [x, 0, y + 1],
                        "state": 0
                    });
                } else if (underblocks == 1) {
                    selectedblocks.forEach(function(b) {
                        if (arraysEqual(blocklist[b[0]][0][0], nbtblocklist[blockid]["Colors"][0])) {
                            if (blocklist[b[1]][1][3])
                                blocks.push({
                                    "pos": [x, 0, y + 1],
                                    "state": 0
                                });
                        }
                    });
                }
            }
        }
    }
    //edit SIZE parameter!!!
    //return {"blocks":blocks,"entities":{},"palette":nbtblocklist,"size":[ctx.canvas.width,2,ctx.canvas.height],"author":"rebane2001.com/mapartcraft","DataVersion":1343};
    let mapData = {
        name: "",
        value: {
            blocks: {
                type: "list",
                value: {
                    type: "compound",
                    value: blocks.map(function(v) {
                        return {
                            pos: {
                                type: "list",
                                value: {
                                    type: "int",
                                    value: [
                                        v["pos"][0],
                                        v["pos"][1],
                                        v["pos"][2]
                                    ]
                                }
                            },
                            state: {
                                type: "int",
                                value: v["state"]
                            }
                        };
                    })
                }
            },
            entities: {
                type: "list",
                value: {
                    type: "compound",
                    value: []
                }
            },
            palette: {
                type: "list",
                value: {
                    type: "compound",
                    value: nbtblocklist.map(function(v) {
                        var base = {
                            "Name": {
                                type: "string",
                                value: v["Name"]
                            }
                        };
                        if ("Properties" in v) {
                            let props = {};
                            Object.keys(v["Properties"]).forEach(function(t) {
                                props[t] = {
                                    type: "string",
                                    value: v["Properties"][t]
                                };
                            });

                            Object.assign(base, {
                                "Properties": {
                                    type: "compound",
                                    value: props
                                }
                            });
                        }

                        return base;
                    })
                }
            },
            size: {
                type: "list",
                value: {
                    type: "int",
                    value: [
                        ctx.canvas.width,
                        (maxheight[1] - maxheight[0]),
                        (ctx.canvas.height + 1)
                    ]
                }
            },
            author: {
                type: "string",
                value: "rebane2001.com/mapartcraft"
            },
            "DataVersion": {
                type: "int",
                value: 1343
            }
        }
    }

    // download
    console.log("Converting map data to NBT");
    let nbtdata = nbt.writeUncompressed(mapData);
    console.log("Gzipping");
    let gzipped = pako.gzip(nbtdata);
    console.log("Blobbing");
    let blob = new Blob([gzipped], {
        type: 'application/x-minecraft-level'
    });
    let a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    url = window.URL.createObjectURL(blob);
    a.href = url;
    a.download = filename + ".nbt";
    a.click();
    window.URL.revokeObjectURL(url);
}

function diff_colors(p1, p2) {
    if (document.getElementById('bettercolor').checked) {
        //return deltaE(rgb2lab(p1),rgb2lab(p2))
        p1 = rgb2lab(p1);
        p2 = rgb2lab(p2);
    }

    r = p1[0] - p2[0];
    g = p1[1] - p2[1];
    b = p1[2] - p2[2];

    return (r * r) + (g * g) + (b * b);
}

function find_closest(pixel) {
    bestval = 9999999;
    newpixel = pixel;

    selectedcolors.forEach(function(p) {
        if (diff_colors(p, pixel) < bestval) {
            bestval = diff_colors(p, pixel);
            newpixel = p;
        }
    });

    return newpixel;
}

function loadImg(e) {
    img = new Image;
    filename = e.target.files[0].name.replace(/\.[^/.]+$/, "");
    img.src = URL.createObjectURL(e.target.files[0]);
    img.onload = function() {
        updateMap();
    }
}

function chooseFile() {
    document.getElementById("imgupload").click();
}

// Thx
// https://stackoverflow.com/a/16436975
function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.
    // Please note that calling sort on an array will modify that array.
    // you might want to clone your array first.

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }

    return true;
}

// rgb2lab conversion based on the one from redstonehelper's program
function rgb2lab(rgb) {
    var r1 = rgb[0] / 255.0,
        g1 = rgb[1] / 255.0,
        b1 = rgb[2] / 255.0;

    f = 0.008856452;
    f2 = 903.2963;
    f3 = 0.964221;
    f4 = 1.0;
    f5 = 0.825211;

    r1 = r1 <= 0.04045 ? (r1 /= 12.0) : Math.pow((r1 + 0.055) / 1.055, 2.4);
    g1 = g1 <= 0.04045 ? (g1 /= 12.0) : Math.pow((g1 + 0.055) / 1.055, 2.4);
    b1 = b1 <= 0.04045 ? (b1 /= 12.0) : Math.pow((b1 + 0.055) / 1.055, 2.4);

    f9 = 0.43605202 * r1 + 0.3850816 * g1 + 0.14308742 * b1;
    f10 = 0.22249159 * r1 + 0.71688604 * g1 + 0.060621485 * b1;
    f11 = 0.013929122 * r1 + 0.097097 * g1 + 0.7141855 * b1;
    f12 = f9 / f3;
    f13 = f10 / f4;
    f14 = f11 / f5;
    f15 = f12 > f ? Math.pow(f12, 1 / 3) : (((f2 * f12) + 16.0) / 116.0);
    f16 = f13 > f ? Math.pow(f13, 1 / 3) : (((f2 * f13) + 16.0) / 116.0);
    f17 = f14 > f ? Math.pow(f14, 1 / 3) : (((f2 * f14) + 16.0) / 116.0);
    f18 = 116.0 * f16 - 16.0;
    f19 = 500.0 * (f15 - f16);
    f20 = 200.0 * (f16 - f17);

    r = parseInt(2.55 * f18 + 0.5);
    g = parseInt(f19 + 0.5);
    b = parseInt(f20 + 0.5);

    return [r, g, b];
}

// Thx Alexander O'Mara
// https://stackoverflow.com/a/41310924
function cssrgb(values) {
    return 'rgb(' + values.join(', ') + ')';
}

document.addEventListener("DOMContentLoaded", function() {
    initialize();
});
