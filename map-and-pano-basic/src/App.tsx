import './App.css';
import { useEffect, useState } from 'react';
import Map from "ol/Map.js";
import OSM from "ol/source/OSM.js";
import TileLayer from "ol/layer/Tile.js";
import View from "ol/View.js";
import Splitter from "m-react-splitters";
import "m-react-splitters/lib/splitters.css";
import { toLonLat } from 'ol/proj';
import Draw, { DrawEvent } from 'ol/interaction/Draw';
import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';
import Text from 'ol/style/Text';
import { never } from 'ol/events/condition';
import { getArea } from 'ol/sphere';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { AnkaDraw, DrawPlugin, PanoGL, ScalablePlugin, SoftTextPlugin } from './easy-pano-import';
import Feature from 'ol/Feature';
import Geometry from 'ol/geom/Geometry';
import Point from 'ol/geom/Point';
import { transform } from 'ol/proj';
import { Icon } from 'ol/style';


export enum PanoDrawStateTypes {
  POINT = 'POINT',
  LINESTRING = 'LINESTRING',
  POLYGON = 'POLYGON',
  CLEAR = 'CLEAR',
  FINISH = 'FINISH',
  DEFAULT = 'DEFAULT',
  NONE = 'NONE'
}

function App() {
  const [first, setfirst] = useState(true);
  const [pano, setPano] = useState<any>();
  const [olMap, setOlMap] = useState<any>();
  const [coordinates, setCoordinates] = useState<any>('28.809624 , 41.069122');
  const [source, setSource] = useState<VectorSource<any>>(new VectorSource())
  const [vector, setVector] = useState<VectorLayer<any>>(new VectorLayer())
  const [draw, setDraw] = useState<any>();
  const [panoDrawType, setPanoDrawType] = useState<PanoDrawStateTypes>(PanoDrawStateTypes.NONE);

  let softtext = window as any
  let scalable = window as any
  const PanoGl = (window as any).AnkaPanAPI.PanoGLV2;


  //panolook için
  let canvas: HTMLCanvasElement;
  let radius: number = 50;
  let layer: VectorLayer<any>;
  let f: Feature<Geometry>;
  let ctx: CanvasRenderingContext2D;
  let color: string = '#ff0000';
  // let color: string = '#6d4a9f';
  let style: Style;

  const [canvasValue, setCanvasValue] = useState<any>(null)
  const [context, setContext] = useState<CanvasRenderingContext2D | undefined>(undefined)
  const [feature, setFeature] = useState<any>(null)
  const [panoCoord, setPanoCoord] = useState<any>({ lat: 24, lon: 24 })
  const [angle, setAngle] = useState<any>({
    rotationX: 0.0,
    rotationY: 0.0,
    fov: 0.8333333333333334
  })

  let panogl: any

  useEffect(() => {
    const map = new Map({
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      target: "map",
      view: new View({
        center: [0, 0],
        zoom: 2,
      }),
    });

    if (map) {
      map.on('pointermove', setCoordinate);
      setOlMap(map)
    }


    if (!PanoGl._instances) {
      panogl = new PanoGl({
        content: "panodiv",
        aroundService: "https://react-gis.ankageo.com/pano/around",
        imageService: "https://react-gis.ankageo.com/pano/img",
        tileService: "https://react-gis.ankageo.com/pano/tile",
      });

      (window as any).panogl = panogl

      softtext = new SoftTextPlugin();
      panogl.setPlugin(softtext);

      scalable = new ScalablePlugin();
      panogl.setPlugin(scalable);

      const draw_ = new DrawPlugin();
      panogl.setPlugin(draw_);
      setDraw(draw_)

      //panonun ilk oluşurken verilmesi gereken koordinatları
      panogl.gotoLocation(24, 24);

      panogl.getTilePlugin()._zoomLevels = [0.9, 0.6, 0.3]
      panogl.addEvent(PanoGl.SETUP_COMPLETE, null, onSetupComplete);
      panogl.addEvent(PanoGl.LOCATION_CHANGE, null, onLocationChange);

      panogl.addEvent(PanoGl.VIEW_ANGLE_CHANGE, null, onViewAngleChange);

      panogl.addEvent(PanoGl.MOUSE_MOVE_ON_GROUND, null, onCursorMoveGround);
      panogl.addEvent(AnkaDraw.DrawPlugin.STATUS_CHANGE, null, onDrawStatusChange);
      //
      panogl.start();
      setPano(panogl);
    }

    return () => {
      map.dispose();
    };
  }, []);

  //panoda çizim yapmak için
  useEffect(() => {
    if (panoDrawType === PanoDrawStateTypes.POLYGON) {
      startGroundPolygon();
    }
    else if (panoDrawType === PanoDrawStateTypes.LINESTRING) {
      startGroundLine();
    }
    else if (panoDrawType === PanoDrawStateTypes.POINT) {
      startGroundPoint();
    }
    else if (panoDrawType === PanoDrawStateTypes.CLEAR) {
      clearAll()
    }
  }, [panoDrawType])


  /**
      * Alan ölçümü için.
      */
  function startGroundPolygon() {
    draw.startPolygon();
  }

  /**
  * Çizgi ölçümü için.
  */
  function startGroundLine() {
    draw.startLine();
  }

  /**
  * Konum ölçümü için.
  * 
  */
  function startGroundPoint() {
    draw.startPoint();
  }

  /**
  * Ölçümleri temizlemek için.
  */
  function clearAll() {
    pano.getScalable()?.getMainSketchLayer().clearAll();
  }

  /**
 * Panoramaya tıklandığında haritanın da hareket etmesi için.
 */
  function onLocationChange(event: any) {
    setPanoCoord({ lat: event.lat, lon: event.lon })
    // dispatch(setCoordPanoToMap({ lat: event.lat, lon: event.lon }))
  }

  function onSetupComplete(event: any) {
    if (event && event.target) {
      event.target.controller.setRotationY(60 / 180 * 3.14)
    }
  }

  /**
   * Panorama açısı için.
   */
  function onViewAngleChange(e: any) {
    let fov = panogl.controller.getFov();
    setAngle({ rotationX: e.rotationX, rotationY: e.rotationY, fov: fov })
    // dispatch(setViewAngle({ rotationX: e.rotationX, rotationY: e.rotationY, fov: fov }))
  }

  /**
   * Panorama üzerinde imlecin hareketini dinleyen fonksiyon.
   */
  function onCursorMoveGround(event: any) {
  }

  /**
* Ölçüm durumlarını dinleyen fonksiyon. 
*/
  function onDrawStatusChange(event: any) {
    console.log(event);

    if (event.status === 'FINISHED' && event.isSuccessful) {
      // dispatch(setPanoDrawState(PanoDrawStateType.FINISH));
    }
  }

  useEffect(() => {
    if (olMap) {
      const source = new VectorSource({ wrapX: false });
      const vector = new VectorLayer({
        source: source,
        zIndex: 1000,
        style: new Style({
          fill: new Fill({
            color: '#ce99ff',
          }),
          stroke: new Stroke({
            color: '#a855f7',
            width: 2,
          }),
        }),
      });

      olMap.addLayer(vector);
      setVector(vector)
      setSource(source)

      return () => {
        olMap.removeLayer(vector)
      }
    }

  }, [olMap])

  const setCoordinate = (e: any) => {
    const translated = toLonLat(e.coordinate)
    const coord = [translated[0].toFixed(6), translated[1].toFixed(6)]
    setCoordinates(coord.join(' , '))
  }


  const openCloseMultiDisplay = () => {
    const PanoGl = (window as any).AnkaPanAPI.PanoGLV2;
    if (pano && PanoGl._instances.length !== 3) {
      const pano2 = pano.createConnectedPano("panodiv2");
      const pano3 = pano.createConnectedPano("panodiv3");
      const prev = pano.getFrameLocation(-1);
      const next = pano.getFrameLocation(1);
      pano2.gotoLocation(prev.lat, prev.lon);
      pano3.gotoLocation(next.lat, next.lon);
      pano2.start();
      pano3.start();
      pano.addEvent(PanoGl.LOCATION_CHANGE, null, () => {
        const prev = pano.getFrameLocation(-1);
        const next = pano.getFrameLocation(1);
        pano2.gotoLocation(prev.lat, prev.lon);
        pano3.gotoLocation(next.lat, next.lon);
      });
    }

    setfirst(!first);
  };

  //map draw example
  const drawPolygon = () => {
    let draw = new Draw({
      source: source,
      type: 'Polygon',
      stopClick: true,
      style: new Style({
        fill: new Fill({
          color: '#ce99ff',
        }),
        stroke: new Stroke({
          color: '#a855f7',
          width: 2,
        }),
        image: new CircleStyle({
          radius: 5,
          fill: new Fill({
            color: 'purple',
          }),
        }),
      }),
      finishCondition: never,
      condition: function (e: any) {
        //sadece solla çizim yapıyor ve sağla bitiriyor
        if (e.originalEvent.buttons === 1) {
          return true;
        } else if (e.originalEvent.buttons === 2) {
          draw.finishDrawing();
          return false;
        }
        else {
          return false;
        }
      }
    });

    olMap.addInteraction(draw);

    drawEnd(draw);

    return () => {
      olMap.removeInteraction(draw)
    }
  }

  const drawEnd = (draw: Draw) => {
    console.log(draw);

    draw.on('drawend', (event: any) => {
      const polygonArea = getArea(event.feature?.getGeometry());
      console.log(polygonArea);

      // setTextAfterDrawEnd(event, polygonArea)
    });
  }



  //panolook için 
  useEffect(() => {
    if (olMap) {

      createCanvas();
      layer = createLayer();
      olMap.addLayer(layer)
      createStyle();
      createFeature();

      olMap.on('click', mapClick);

      return () => {
        olMap.removeLayer(layer)
      }
    }
  }, [olMap])

  useEffect(() => {
    if (canvasValue) {
      createCanvasContent(angle.fov);
    }
  }, [canvasValue])

  useEffect(() => {
    if (panoCoord.lat && feature) {
      const coord = [panoCoord.lon, panoCoord.lat];
      const locationTransform = transform(coord, 'EPSG:4326', 'EPSG:3857');
      // dispatch(setCoordMapToPano(locationTransform))
      feature.setGeometry(new Point(locationTransform))
    }
  }, [panoCoord])

  useEffect(() => {
    if (angle.rotationY && feature) {
      const radius = angle.rotationY * (Math.PI / 180);
      if (feature) {
        feature!.getStyle().getImage().setRotation(radius);
        feature.notify();
      }
    }

    if (canvasValue && context) {
      context.clearRect(0, 0, canvasValue.width, canvasValue.height);
      createCanvasContent(angle.fov);
      feature.notify();
    }
  }, [angle])

  const mapClick = (event: any) => {
    const clickedCoordinate = event.coordinate;
    if (clickedCoordinate) {
      olMap.getView().setCenter(clickedCoordinate);
    }

  }

  const createCanvas = () => {
    canvas = document.createElement('canvas');
    canvas.width = radius * 2;
    canvas.height = radius * 2;
    setCanvasValue(canvas);
  }

  const createCanvasContent = (fov: number) => {
    const degree = fov;
    const startDegree = 270 - (degree / 2);
    const endDegree = startDegree + degree;

    ctx = canvasValue.getContext('2d')!;
    ctx.beginPath();
    ctx.moveTo(radius, radius);
    ctx.arc(radius, radius, radius, startDegree * (Math.PI / 180), endDegree * (Math.PI / 180));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    setContext(ctx);
  }

  const createStyle = () => {
    const image = new Icon({
      img: canvas,
      rotateWithView: true,
      imgSize: [radius * 2, radius * 2],
      opacity: 0.5
    });
    style = new Style({
      zIndex: 1000000,
      image
    });
  }

  const createLayer = () => {
    return new VectorLayer({ source: new VectorSource(), zIndex: 200000000 });
  }

  const createFeature = () => {
    f = new Feature();
    f.setStyle(style);
    const coord = [panoCoord.lon, panoCoord.lat];
    const locationTransform = transform(coord, 'EPSG:4326', 'EPSG:3857');
    const point = new Point(locationTransform);
    f.setGeometry(point);
    layer.getSource().addFeature(f);
    setFeature(f)
  }



  return (
    <div className="container">

      <div className='PanoLook'></div>


      <div className="map-buttons">
        <button onClick={drawPolygon}>Draw Polygon</button>
        <button onClick={openCloseMultiDisplay}>MultiDisplay</button>
      </div>

      <div className="pano-buttons">
        <button onClick={() => setPanoDrawType(PanoDrawStateTypes.POINT)}>Point</button>
        <button onClick={() => setPanoDrawType(PanoDrawStateTypes.LINESTRING)}>Line</button>
        <button onClick={() => setPanoDrawType(PanoDrawStateTypes.POLYGON)}>Polygon</button>
        <button onClick={() => setPanoDrawType(PanoDrawStateTypes.CLEAR)}>Clear</button>
      </div>

      <div className='coordinate-container'>{coordinates}</div>
      <Splitter position="vertical" dispatchResize={true} postPoned={false}>

        <div style={{ height: "100%", width: "100%" }} id="map"></div>
        <Splitter
          position="horizontal"
          primaryPaneMaxWidth="80%"
          primaryPaneMinWidth={0}
          primaryPaneWidth="50%"
          maximizedPrimaryPane={first}
          postPoned={false}
        >
          <div id="panodiv"></div>
          <Splitter position="vertical">
            <div id="panodiv2"></div>
            <div id="panodiv3"></div>
          </Splitter>
        </Splitter>
      </Splitter>
    </div>
  );
}

export default App;
