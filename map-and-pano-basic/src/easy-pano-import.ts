let PanoGL: any;
let AnkaPanAPI: any;
let PanoromicController: any;
let Utils: any;

if ((window as any).AnkaPanAPI !== undefined) {
    AnkaPanAPI = (window as any).AnkaPanAPI;
    PanoGL = AnkaPanAPI.PanoGLV2;
    Utils = AnkaPanAPI.Utils;
    PanoromicController = AnkaPanAPI.PanoromicController;
} else {
    throw new Error('AnkaPanAPI could not be found in page');
}

let SoftTextPlugin: any;
const AnkaSoftText: any = (window as any).AnkaSoftText;
if (typeof AnkaSoftText === 'object') {
    SoftTextPlugin = AnkaSoftText.SoftTextPlugin;
} else {
    throw new Error('AnkaSoftText could not be found in page');
}

const Three: any = (window as any).THREE;
if (typeof Three !== 'object') {
    throw new Error('AnkaScalable could not be found in page');
}

let ScalablePlugin: any;
let GeomDataHolder: any;
let GeoServerWFSLayer: any;
let Layer: any;
let SketchLayer: any;

const AnkaScalable: any = (window as any).AnkaScalable;
if (typeof AnkaScalable === 'object') {
    ScalablePlugin = AnkaScalable.ScalablePlugin;
    GeomDataHolder = AnkaScalable.GeomDataHolder;
    GeoServerWFSLayer = AnkaScalable.GeoServerWFSLayer;
    SketchLayer = AnkaScalable.SketchLayer;
    Layer = AnkaScalable.Layer;
} else {
    throw new Error('AnkaScalable could not be found in page');
}

let DrawPlugin: any;
const AnkaDraw: any = (window as any).AnkaDraw;
if (typeof AnkaDraw === 'object') {
    DrawPlugin = AnkaDraw.DrawPlugin;
} else {
    throw new Error('AnkaDraw could not be found in page');
}

export {
    AnkaPanAPI, AnkaDraw, Utils, PanoGL, PanoromicController, SoftTextPlugin,
    ScalablePlugin, DrawPlugin, GeomDataHolder, AnkaScalable, Three, GeoServerWFSLayer, SketchLayer,
    Layer,
};
