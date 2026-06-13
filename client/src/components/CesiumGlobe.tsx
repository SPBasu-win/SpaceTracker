import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import { getGlobeAssets } from '../api/orbitalApi'
import { useGlobeStore } from '../stores/globeStore'
import type { GlobeAsset } from '../types/orbital'

type EntityMap = Map<number, Cesium.Entity>

export function CesiumGlobe() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const entityMapRef = useRef<EntityMap>(new Map())
  const geoJsonRef = useRef<Cesium.GeoJsonDataSource | null>(null)
  const setSelected = useGlobeStore((state) => state.setSelected)
  const mapStyle = useGlobeStore((state) => state.mapStyle)

  useEffect(() => {
    if (!containerRef.current) return

    Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_ION_TOKEN || ''

    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      baseLayer: false, // We manage layers manually
    })
    viewer.scene.globe.enableLighting = true
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#10253f')
    viewer.scene.postProcessStages.fxaa.enabled = true
    viewerRef.current = viewer

    Cesium.GeoJsonDataSource.load('https://raw.githubusercontent.com/datasets/geo-boundaries-world-110m/master/countries.geojson', {
      stroke: Cesium.Color.BLACK,
      fill: Cesium.Color.TRANSPARENT,
      strokeWidth: 3,
      clampToGround: false,
    }).then((ds) => {
      if (!viewer.isDestroyed()) {
        const entities = ds.entities.values;
        // The Polygon pipeline crashes on huge countries (RhumbLineSubdivision RangeError).
        // To fix this, we extract the raw positions from the polygons and turn them into Polylines!
        for (let i = 0; i < entities.length; i++) {
          const entity = entities[i];
          if (entity.polygon) {
            const hierarchyProp = entity.polygon.hierarchy;
            if (hierarchyProp) {
              const hierarchy = hierarchyProp.getValue(Cesium.JulianDate.now());
              if (hierarchy) {
                // Main outer border
                if (hierarchy.positions && hierarchy.positions.length > 0) {
                  entity.polyline = new Cesium.PolylineGraphics({
                    positions: hierarchy.positions,
                    width: 3,
                    material: Cesium.Color.BLACK,
                    clampToGround: false
                  });
                }
                // Sub-borders (holes like lakes/inner countries)
                if (hierarchy.holes && hierarchy.holes.length > 0) {
                  for (const hole of hierarchy.holes) {
                    if (hole.positions && hole.positions.length > 0) {
                      ds.entities.add(new Cesium.Entity({
                        polyline: {
                          positions: hole.positions,
                          width: 3,
                          material: Cesium.Color.BLACK,
                          clampToGround: false
                        }
                      }));
                    }
                  }
                }
              }
            }
            // Strip the crashing polygon geometry completely!
            entity.polygon = undefined as any;
          }
        }
        
        geoJsonRef.current = ds
        ds.show = false
        viewer.dataSources.add(ds)
      }
    }).catch(console.error)

    let currentBorderWidth = 3
    const removeListener = viewer.scene.preUpdate.addEventListener(() => {
      const height = viewer.camera.positionCartographic.height
      const indicator = document.getElementById('altitude-indicator')
      if (indicator) {
        indicator.innerText = `Altitude: ${(height / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })} km`
      }
      if (geoJsonRef.current) {
        const currentStyle = useGlobeStore.getState().mapStyle
        geoJsonRef.current.show = currentStyle === 'map' && height <= 29307000

        // Dynamic border width based on altitude
        let newWidth = 3
        if (height > 8000000) newWidth = 1
        else if (height > 3000000) newWidth = 2
        
        if (newWidth !== currentBorderWidth) {
          currentBorderWidth = newWidth
          const targetWidth = new Cesium.ConstantProperty(newWidth)
          for (const entity of geoJsonRef.current.entities.values) {
            if (entity.polyline) {
              entity.polyline.width = targetWidth
            }
          }
        }
      }
    })

    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((movement: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const picked = viewer.scene.pick(movement.position)
      if (Cesium.defined(picked?.id)) {
        const entity = picked.id as Cesium.Entity
        const asset = entity.properties?.asset?.getValue(Cesium.JulianDate.now()) as GlobeAsset | undefined
        if (asset) {
          setSelected(asset)
          viewer.flyTo(entity, { duration: 0.9, offset: new Cesium.HeadingPitchRange(0, -0.7, 1_400_000) })
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    let cancelled = false
    const refresh = async () => {
      const { assets } = await getGlobeAssets()
      if (cancelled || viewer.isDestroyed()) return
      updateEntities(viewer, entityMapRef.current, assets)
    }

    refresh().catch(console.error)
    const timer = window.setInterval(() => refresh().catch(console.error), 15_000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      removeListener()
      handler.destroy()
      viewer.destroy()
      viewerRef.current = null
      entityMapRef.current.clear()
    }
  }, [setSelected])

  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    let cancelled = false

    const loadImagery = async () => {
      viewer.scene.imageryLayers.removeAll()
      let provider: Cesium.ImageryProvider | undefined

      if (mapStyle === 'map') {
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#015f96')
      } else {
        viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#10253f')
      }

      try {
        if (mapStyle === 'satellite') {
          provider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
            'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
          )
        } else if (mapStyle === 'map') {
          provider = new Cesium.OpenStreetMapImageryProvider({
            url: 'https://a.tile.openstreetmap.org/',
          })
        } else if (mapStyle === 'ion') {
          const token = import.meta.env.VITE_CESIUM_ION_TOKEN
          if (token) {
            Cesium.Ion.defaultAccessToken = token
            provider = await Cesium.IonImageryProvider.fromAssetId(2) // Bing Maps Aerial
          } else {
            console.warn('VITE_CESIUM_ION_TOKEN is not set, falling back to satellite mode.')
            provider = await Cesium.ArcGisMapServerImageryProvider.fromUrl(
              'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'
            )
          }
        }
      } catch (e) {
        console.error('Failed to load imagery provider', e)
      }

      if (!cancelled && provider && !viewer.isDestroyed()) {
        const layer = viewer.scene.imageryLayers.addImageryProvider(provider)
        
        if (mapStyle === 'map') {
          layer.colorToAlpha = Cesium.Color.fromCssColorString('#aad3df')
          layer.colorToAlphaThreshold = 0.15
          layer.brightness = 1.1
          layer.contrast = 1.1
          layer.saturation = 0.0
        }
      }
    }

    loadImagery()

    return () => { 
      cancelled = true
    }
  }, [mapStyle])

  return <div ref={containerRef} className="globe-canvas" />
}

function updateEntities(viewer: Cesium.Viewer, entities: EntityMap, assets: GlobeAsset[]) {
  const seen = new Set<number>()
  for (const asset of assets) {
    seen.add(asset.catalogNumber)
    const position = Cesium.Cartesian3.fromDegrees(asset.longitude, asset.latitude, asset.altitudeKm * 1000)
    const existing = entities.get(asset.catalogNumber)
    if (existing) {
      existing.position = new Cesium.ConstantPositionProperty(position)
      existing.properties = new Cesium.PropertyBag({ asset })
      continue
    }
    const entity = viewer.entities.add({
      id: String(asset.catalogNumber),
      name: asset.name ?? String(asset.catalogNumber),
      position,
      point: {
        pixelSize: 4,
        color: colorForClass(asset.assetClass),
        outlineColor: Cesium.Color.BLACK.withAlpha(0.55),
        outlineWidth: 1,
        scaleByDistance: new Cesium.NearFarScalar(1_000_000, 1.4, 35_000_000, 0.45),
      },
      properties: { asset },
    })
    entities.set(asset.catalogNumber, entity)
  }

  for (const [catalogNumber, entity] of entities) {
    if (!seen.has(catalogNumber)) {
      viewer.entities.remove(entity)
      entities.delete(catalogNumber)
    }
  }
}

function colorForClass(assetClass: GlobeAsset['assetClass']) {
  if (assetClass === 'DEBRIS') return Cesium.Color.SALMON
  if (assetClass === 'NAVIGATION') return Cesium.Color.LIME
  if (assetClass === 'COMMUNICATION') return Cesium.Color.CYAN
  if (assetClass === 'WEATHER' || assetClass === 'EARTH_OBSERVATION') return Cesium.Color.GOLD
  return Cesium.Color.WHITE
}
