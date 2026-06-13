import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import { getGlobeAssets } from '../api/orbitalApi'
import { useGlobeStore } from '../stores/globeStore'
import type { GlobeAsset } from '../types/orbital'

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN ?? ''

type EntityMap = Map<number, Cesium.Entity>

export function CesiumGlobe() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const entityMapRef = useRef<EntityMap>(new Map())
  const setSelected = useGlobeStore((state) => state.setSelected)

  useEffect(() => {
    if (!containerRef.current) return

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
    })
    viewer.scene.globe.enableLighting = true
    viewer.scene.postProcessStages.fxaa.enabled = true
    viewerRef.current = viewer

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
      if (cancelled) return
      updateEntities(viewer, entityMapRef.current, assets)
    }

    refresh().catch(console.error)
    const timer = window.setInterval(() => refresh().catch(console.error), 15_000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
      handler.destroy()
      viewer.destroy()
      viewerRef.current = null
      entityMapRef.current.clear()
    }
  }, [setSelected])

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
