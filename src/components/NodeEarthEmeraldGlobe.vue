<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import type { NodeData } from '@/stores/nodes'
import { Icon } from '@iconify/vue'
import { useDocumentVisibility, useElementSize, useElementVisibility, useRafFn } from '@vueuse/core'
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  Group,
  Line,
  LinearFilter,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  TextureLoader,
  Vector3,
  WebGLRenderer,
} from 'three'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { usePublishedGlobeLocations } from '@/composables/usePublishedGlobeLocations'
import { useAppStore } from '@/stores/app'
import { closestEquivalentAngle, normalizeAccumulatedAngle } from '@/utils/angleHelper'
import { batchCountryBoundaries } from '@/utils/batchCountryBoundaries'
import { buildGlobeClusterRates } from '@/utils/buildGlobeClusters'
import { getCoordByCode } from '@/utils/geoHelper'
import { buildGlobeCityMembers } from '@/utils/globeCityDetails'
import { createGlobeLabelLayout } from '@/utils/globeLabelPlacement'
import { markerVisualState } from '@/utils/globeMarkerVisuals'
import { formatBytesPerSecondSplit } from '@/utils/helper'
import { getSunDirection } from '@/utils/solarPosition'

const props = defineProps<{ nodes?: NodeData[], rateNodes?: NodeData[], immersive?: boolean, visitorCountryCode?: string, visitorExitCoord?: [number, number] | null }>()
const EARTH_TEXTURE_URL = `${import.meta.env.BASE_URL}assets/earth/earth-blue-marble.webp`
const appStore = useAppStore()
const displayNodes = computed(() => props.nodes ?? [])

const containerRef = ref<HTMLDivElement>()
const canvasRef = ref<HTMLCanvasElement>()
const { width: containerWidth, height: containerHeight } = useElementSize(containerRef)
const documentVisibility = useDocumentVisibility()
const elementVisible = useElementVisibility(containerRef)
const shouldRender = computed(() => documentVisibility.value === 'visible' && elementVisible.value)
const GLOBE_FPS = computed(() => (containerWidth.value >= 384 ? 45 : 30))
const EARTH_RADIUS = 1
const MAX_ARC_ALTITUDE = 0.16
const SOLAR_UPDATE_INTERVAL_MS = 30_000
const EARTH_AXIAL_TILT_DEG = 23.439
const EARTH_AXIAL_TILT_RAD = EARTH_AXIAL_TILT_DEG * Math.PI / 180
const INITIAL_VIEW_PITCH = 0.42
const INITIAL_ROTATION_Y = 0.15
const RETURN_DELAY_MS = 1200
const AUTO_ROTATION_SPEED = 0.00022
const countryDisplayNames = typeof Intl !== 'undefined'
  ? new Intl.DisplayNames(['zh-CN'], { type: 'region' })
  : null

let renderer: WebGLRenderer | null = null
let scene: Scene | null = null
let camera: PerspectiveCamera | null = null
let viewPitchGroup: Group | null = null
let axialTiltGroup: Group | null = null
let earthGroup: Group | null = null
let earthMesh: Mesh | null = null
let atmosphereMesh: Mesh | null = null
let starField: Points | null = null
let countryBorders: Group | null = null
let boundaryLoadToken = 0
const breathingMarkers: Sprite[] = []
interface SignalRipple {
  ripple: Sprite
  phase: number
}
interface NetworkArc {
  curve: CatmullRomCurve3
  arcPulse: Sprite
  phase: number
}
const signalRipples: SignalRipple[] = []
const networkArcs: NetworkArc[] = []
let visitorBeacon: Sprite | null = null
const visitorOverlayRef = ref<HTMLDivElement>()
const MIXED_MARKER_GREEN = new Color(0x18E05F)
const markerFrameColor = new Color()
let isPointerDown = false
let lastPointerX = 0
let lastPointerY = 0
let targetViewPitch = INITIAL_VIEW_PITCH
let targetRotationY = INITIAL_ROTATION_Y
let lastReleaseAt = 0
let lastFrameAt = 0
let defaultRotationY = INITIAL_ROTATION_Y
let returningToDefault = false
const earthFixedSunDirection = new Vector3()
let lastSolarUpdate = 0

const { regionClusters, locations } = usePublishedGlobeLocations(() => props.nodes)
interface RegionRate {
  up: number
  down: number
}
const serverCountryCodes = computed(() => new Set(regionClusters.value.map(cluster => cluster.code)))

const regionRates = computed(() => buildGlobeClusterRates(props.rateNodes ?? displayNodes.value, locations.value, regionClusters.value))
const selectedCityId = ref<string | null>(null)
const selectedCity = computed(() => regionClusters.value.find(c => c.id === selectedCityId.value))
const cityMembers = computed(() => buildGlobeCityMembers(displayNodes.value, locations.value))
const selectedMembers = computed(() => cityMembers.value.get(selectedCityId.value ?? '') ?? [])
let pointerStartX = 0
let pointerStartY = 0
let pointerDragged = false
let pointerCity: string | null = null
function cityPointerDown(event: PointerEvent, id: string) {
  pointerCity = id
  onPointerDown(event)
}
function cityClick(id: string) {
  selectedCityId.value = selectedCityId.value === id ? null : id
}
function outsidePointerDown(event: PointerEvent) {
  if (!(event.target as Element).closest('.region-badge, .city-detail'))
    selectedCityId.value = null
}

const userCoord = computed<[number, number] | null>(() => {
  if (!appStore.visitorInfoEnabled)
    return null
  return props.visitorExitCoord ?? getCoordByCode(props.visitorCountryCode)
})
const visitorSharesRegion = computed(() => !props.visitorExitCoord && !!userCoord.value
  && regionClusters.value.some(cluster => cluster.id === props.visitorCountryCode?.toLowerCase()))

const totalServers = computed(() => displayNodes.value.length)
const onlineServers = computed(() => displayNodes.value.filter(node => node.online).length)
const offlineServers = computed(() => totalServers.value - onlineServers.value)
const clusterOverlayEls = new Map<string, HTMLDivElement>()
const clusterLeaderEls = new Map<string, SVGLineElement>()
const clusterAnchorEls = new Map<string, SVGCircleElement>()
const clusterOverlayRefBinders = new Map<string, (el: Element | ComponentPublicInstance | null) => void>()

function countryNameFor(code: string): string {
  return countryDisplayNames?.of(code) ?? code
}

function rateFor(code: string): RegionRate {
  return regionRates.value.get(code) ?? { up: 0, down: 0 }
}

function formatRate(bytesPerSec: number): string {
  const { value, unit } = formatBytesPerSecondSplit(bytesPerSec, appStore.byteDecimals)
  return `${value} ${unit}`
}

function latLonToVector([lat, lon]: [number, number], radius = EARTH_RADIUS): Vector3 {
  const phi = (90 - lat) * Math.PI / 180
  const theta = (lon + 180) * Math.PI / 180
  return new Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  )
}

function rotationFacingCoord(coord: [number, number]): number {
  const point = latLonToVector(coord)
  return Math.atan2(-point.x, point.z)
}

function rotationFacingLargestRegion(): number {
  const largest = regionClusters.value[0]
  if (!largest)
    return INITIAL_ROTATION_Y
  return rotationFacingCoord(largest.coord)
}

const positionStorageKey = 'glass-emerald-globe-position-v1'

interface PersistedGlobePosition {
  pitch: number
  rotationY: number
}

function readPersistedGlobePosition(): PersistedGlobePosition | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(positionStorageKey) || 'null') as Partial<PersistedGlobePosition> | null
    if (!parsed || !Number.isFinite(parsed.pitch) || !Number.isFinite(parsed.rotationY))
      return null
    return { pitch: Number(parsed.pitch), rotationY: Number(parsed.rotationY) }
  }
  catch {
    return null
  }
}

function persistGlobePosition(): void {
  localStorage.setItem(positionStorageKey, JSON.stringify({ pitch: targetViewPitch, rotationY: normalizeAccumulatedAngle(targetRotationY) }))
}

function clearPersistedGlobePosition(): void {
  localStorage.removeItem(positionStorageKey)
  targetViewPitch = INITIAL_VIEW_PITCH
  const resetRotation = rotationFacingLargestRegion()
  targetRotationY = earthGroup
    ? closestEquivalentAngle(earthGroup.rotation.y, resetRotation)
    : resetRotation
  defaultRotationY = targetRotationY
  returningToDefault = true
}

function smoothstepVisibility(edge0: number, edge1: number, value: number): number {
  const normalized = Math.max(0, Math.min(1, (value - edge0) / (edge1 - edge0)))
  return normalized * normalized * (3 - 2 * normalized)
}

function surfaceFacingOpacity(object: Sprite): number {
  if (!earthGroup || !camera)
    return 0
  const world = object.getWorldPosition(new Vector3())
  const globeCenter = earthGroup.getWorldPosition(new Vector3())
  const normal = world.clone().sub(globeCenter).normalize()
  const toCamera = camera.position.clone().sub(world).normalize()
  return smoothstepVisibility(0.03, 0.18, normal.dot(toCamera))
}

function createMarkerTexture(color: string): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 30)
  gradient.addColorStop(0, color)
  gradient.addColorStop(0.18, `${color}e8`)
  gradient.addColorStop(0.52, `${color}68`)
  gradient.addColorStop(1, `${color}00`)
  context.fillStyle = gradient
  context.fillRect(0, 0, 64, 64)
  const texture = new CanvasTexture(canvas)
  texture.minFilter = LinearFilter
  return texture
}

function createRippleTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(64, 64, 32, 64, 64, 61)
  gradient.addColorStop(0, 'rgba(255,255,255,0)')
  gradient.addColorStop(0.72, 'rgba(255,255,255,0)')
  gradient.addColorStop(0.88, 'rgba(255,255,255,0.72)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 128, 128)
  const texture = new CanvasTexture(canvas)
  texture.minFilter = LinearFilter
  return texture
}

interface CountryBoundaryData {
  countries: Array<{ code: string, rings: number[][][] }>
}

let countryBoundaryPromise: Promise<CountryBoundaryData> | null = null

function getCountryBoundaryData(): Promise<CountryBoundaryData> {
  countryBoundaryPromise ??= fetch(`${import.meta.env.BASE_URL}assets/earth/country-boundaries-v1.json`)
    .then((response) => {
      if (!response.ok)
        throw new Error(`Country boundary resource failed: ${response.status}`)
      return response.json() as Promise<CountryBoundaryData>
    })
    .catch((error) => {
      countryBoundaryPromise = null
      throw error
    })
  return countryBoundaryPromise
}

async function loadCountryBorders(): Promise<void> {
  if (!earthGroup)
    return

  const loadToken = ++boundaryLoadToken
  const data = await getCountryBoundaryData()
  if (!earthGroup || loadToken !== boundaryLoadToken)
    return

  if (countryBorders) {
    earthGroup.remove(countryBorders)
    disposeObject(countryBorders)
  }

  countryBorders = new Group()
  const batches = batchCountryBoundaries(data.countries, serverCountryCodes.value, (coord) => {
    const point = latLonToVector(coord, 1.006)
    return [point.x, point.y, point.z]
  })
  for (const [positions, highlighted] of [[batches.normal, false], [batches.highlighted, true]] as const) {
    if (!positions.length)
      continue
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    const material = new LineBasicMaterial({
      color: highlighted ? 0x18E05F : 0xB5E6D2,
      transparent: true,
      opacity: highlighted ? 0.92 : 0.30,
      depthWrite: false,
    })
    countryBorders.add(new LineSegments(geometry, material))
  }
  earthGroup.add(countryBorders)
}

function createSurfaceArcCurve(from: [number, number], to: [number, number]): CatmullRomCurve3 {
  const start = latLonToVector(from, 1.018).normalize()
  const end = latLonToVector(to, 1.018).normalize()
  const angle = start.angleTo(end)
  const altitude = Math.min(MAX_ARC_ALTITUDE, 0.035 + angle * 0.075)
  const points: Vector3[] = []
  for (let index = 0; index <= 48; index++) {
    const progress = index / 48
    const direction = start.clone().lerp(end, progress).normalize()
    const radius = 1.018 + Math.sin(Math.PI * progress) * altitude
    points.push(direction.multiplyScalar(radius))
  }
  return new CatmullRomCurve3(points)
}

function makeArc(from: [number, number], to: [number, number], pulseTexture: CanvasTexture, phase: number): Line {
  const curve = createSurfaceArcCurve(from, to)
  const geometry = new BufferGeometry().setFromPoints(curve.getPoints(72))
  const material = new LineBasicMaterial({ color: 0x55C7F4, transparent: true, opacity: 0.34, depthWrite: false })
  const line = new Line(geometry, material)
  const arcPulse = new Sprite(new SpriteMaterial({
    map: pulseTexture,
    color: 0x9FEAFF,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
    opacity: 0.82,
  }))
  arcPulse.scale.setScalar(0.035)
  arcPulse.userData.dataLayer = true
  line.add(arcPulse)
  networkArcs.push({ curve, arcPulse, phase })
  return line
}

function disposeObject(object: Group | Mesh | Points | Line) {
  object.traverse((child) => {
    const mesh = child as Mesh
    mesh.geometry?.dispose()
    const material = mesh.material
    if (Array.isArray(material))
      material.forEach(item => item.dispose())
    else
      material?.dispose()
  })
}

function rebuildDataLayers() {
  if (!earthGroup)
    return
  for (const child of [...earthGroup.children]) {
    if (child.userData.dataLayer) {
      earthGroup.remove(child)
      disposeObject(child as Group)
    }
  }
  breathingMarkers.length = 0
  signalRipples.length = 0
  networkArcs.length = 0
  visitorBeacon = null

  const markerTexture = createMarkerTexture('#ffffff')
  const rippleTexture = createRippleTexture()
  for (const cluster of regionClusters.value) {
    const markerStatus = cluster.onlineServers === 0 ? 'offline' : cluster.onlineServers < cluster.servers ? 'mixed' : 'online'
    const markerMaterial = new SpriteMaterial({ map: markerTexture, color: MIXED_MARKER_GREEN, transparent: true, depthTest: true, depthWrite: false, opacity: 0.76 })
    const marker = new Sprite(markerMaterial)
    marker.position.copy(latLonToVector(cluster.coord, 1.025))
    marker.scale.setScalar(0.074)
    marker.userData.breathingMarker = true
    marker.userData.phase = Math.random() * Math.PI * 2
    marker.userData.markerStatus = markerStatus
    marker.userData.dataLayer = true
    breathingMarkers.push(marker)
    earthGroup.add(marker)

    for (let index = 0; index < 2; index++) {
      const rippleMaterial = new SpriteMaterial({
        map: rippleTexture,
        color: MIXED_MARKER_GREEN,
        blending: AdditiveBlending,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        opacity: 0,
      })
      const ripple = new Sprite(rippleMaterial)
      ripple.position.copy(latLonToVector(cluster.coord, 1.024))
      ripple.userData.markerStatus = markerStatus
      ripple.userData.dataLayer = true
      earthGroup.add(ripple)
      signalRipples.push({ ripple, phase: index * 0.5 })
    }
  }

  const visitor = userCoord.value
  if (visitor) {
    const visitorMaterial = new SpriteMaterial({
      map: markerTexture,
      color: 0xFFD54A,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      opacity: 0.96,
    })
    visitorBeacon = new Sprite(visitorMaterial)
    visitorBeacon.position.copy(latLonToVector(visitor, 1.032))
    visitorBeacon.scale.setScalar(0.11)
    visitorBeacon.userData.dataLayer = true
    earthGroup.add(visitorBeacon)
    // Data-layer refresh must not reset the user's view or auto-rotation phase.
    // Initial/default view is selected by startGlobe, never by live counts.

    regionClusters.value.forEach((cluster, index) => {
      const arc = makeArc(cluster.coord, visitor, markerTexture, index / Math.max(regionClusters.value.length, 1))
      arc.userData.dataLayer = true
      earthGroup!.add(arc)
    })
  }
}

function createStarField(): Points {
  const positions: number[] = []
  for (let i = 0; i < 260; i++) {
    const radius = 3 + Math.random() * 2
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions.push(
      radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta),
    )
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(positions), 3))
  const material = new PointsMaterial({ color: 0xB8DCFF, size: 0.012, transparent: true, opacity: 0.45 })
  return new Points(geometry, material)
}

const placeGlobeLabels = createGlobeLabelLayout()

function syncOverlayPositions() {
  if (!earthGroup || !camera || !containerRef.value)
    return
  const width = containerWidth.value || 320
  const height = containerHeight.value || width
  const labels: Array<{ id: string, x: number, y: number, width: number, height: number }> = []
  let visitorVisible = false
  const visitor = userCoord.value
  const visitorEl = visitorOverlayRef.value
  if (visitor && visitorEl) {
    const world = latLonToVector(visitor, 1.055).applyMatrix4(earthGroup.matrixWorld)
    visitorVisible = world.clone().normalize().dot(camera.position.clone().sub(world).normalize()) > 0.05
    const projected = world.clone().project(camera)
    if (visitorVisible) {
      labels.push({
        id: '__visitor__',
        x: (projected.x * 0.5 + 0.5) * width,
        y: (-projected.y * 0.5 + 0.5) * height,
        width: visitorEl.offsetWidth,
        height: visitorEl.offsetHeight,
      })
    }
  }
  for (const cluster of regionClusters.value) {
    const el = clusterOverlayEls.get(cluster.id)
    if (!el)
      continue
    const world = latLonToVector(cluster.coord, 1.04).applyMatrix4(earthGroup.matrixWorld)
    const visible = world.clone().normalize().dot(camera.position.clone().sub(world).normalize()) > 0.05
    const projected = world.clone().project(camera)
    if (!visible) {
      el.style.opacity = '0'
      el.style.pointerEvents = 'none'
      el.tabIndex = -1
      const anchor = clusterAnchorEls.get(cluster.id)
      const leader = clusterLeaderEls.get(cluster.id)
      if (anchor)
        anchor.style.opacity = '0'
      if (leader)
        leader.style.opacity = '0'
      continue
    }
    labels.push({
      id: cluster.id,
      x: (projected.x * 0.5 + 0.5) * width,
      y: (-projected.y * 0.5 + 0.5) * height,
      width: el.offsetWidth,
      height: el.offsetHeight,
    })
  }
  for (const placement of placeGlobeLabels(labels, width, height)) {
    if (placement.id === '__visitor__') {
      if (visitorEl) {
        visitorEl.style.transform = `translate3d(${placement.left}px, ${placement.top}px, 0)`
        visitorEl.style.opacity = placement.visible && visitorVisible ? '1' : '0'
      }
      continue
    }
    const el = clusterOverlayEls.get(placement.id)!
    el.style.transform = `translate3d(${placement.left}px, ${placement.top}px, 0)`
    el.style.opacity = placement.visible ? '1' : '0'
    el.style.pointerEvents = placement.visible ? 'auto' : 'none'
    el.tabIndex = placement.visible ? 0 : -1
    el.style.filter = placement.visible ? 'none' : 'blur(8px)'
    const label = labels.find(item => item.id === placement.id)!
    const anchor = clusterAnchorEls.get(placement.id)
    const leader = clusterLeaderEls.get(placement.id)
    if (anchor) {
      anchor.setAttribute('cx', String(label.x))
      anchor.setAttribute('cy', String(label.y))
      anchor.style.opacity = '1'
    }
    if (leader) {
      const x1 = Math.max(placement.left, Math.min(label.x, placement.left + label.width))
      const y1 = Math.max(placement.top, Math.min(label.y, placement.top + label.height))
      leader.setAttribute('x1', String(x1))
      leader.setAttribute('y1', String(y1))
      leader.setAttribute('x2', String(label.x))
      leader.setAttribute('y2', String(label.y))
      leader.style.opacity = placement.visible ? '1' : '0'
    }
  }

  if (visitorEl && !visitorVisible)
    visitorEl.style.opacity = '0'
}

function resizeRenderer() {
  if (!renderer || !camera)
    return
  const width = containerWidth.value || 320
  const height = containerHeight.value || width
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.position.z = width < 640 ? 3.65 : 2.32
  camera.updateProjectionMatrix()
}

function updateSolarLighting(now = Date.now()) {
  if (!earthGroup || !earthMesh || !atmosphereMesh)
    return
  if (now - lastSolarUpdate >= SOLAR_UPDATE_INTERVAL_MS || lastSolarUpdate === 0) {
    earthFixedSunDirection.fromArray(getSunDirection(new Date(now))).normalize()
    lastSolarUpdate = now
  }
  ;(earthMesh.material as ShaderMaterial).uniforms.sunDirection!.value.copy(earthFixedSunDirection)
  ;(atmosphereMesh.material as ShaderMaterial).uniforms.sunDirection!.value.copy(earthFixedSunDirection)
}

function renderFrame() {
  if (!renderer || !scene || !camera || !earthGroup || !viewPitchGroup)
    return
  const now = performance.now()
  const elapsed = lastFrameAt ? Math.min(now - lastFrameAt, 50) : 0
  lastFrameAt = now
  if (!isPointerDown && appStore.stopEarth)
    returningToDefault = false
  if (!isPointerDown && !selectedCityId.value && !appStore.stopEarth && now - lastReleaseAt > RETURN_DELAY_MS) {
    targetViewPitch = INITIAL_VIEW_PITCH
    if (!returningToDefault) {
      // Return by the nearest longitude rather than spinning a full turn.
      targetRotationY = closestEquivalentAngle(targetRotationY, defaultRotationY)
      returningToDefault = true
    }
    if (Math.abs(targetRotationY - earthGroup.rotation.y) < 0.018) {
      const advance = AUTO_ROTATION_SPEED * elapsed
      targetRotationY += advance
      defaultRotationY += advance
    }
  }
  viewPitchGroup.rotation.x += (targetViewPitch - viewPitchGroup.rotation.x) * 0.18
  earthGroup.rotation.y += (targetRotationY - earthGroup.rotation.y) * 0.18
  updateSolarLighting()
  starField?.rotation.y && (starField.rotation.y += 0.0001)
  earthGroup.updateMatrixWorld(true)
  const pulseTime = now * 0.0024
  for (const marker of breathingMarkers) {
    const visual = markerVisualState(pulseTime + marker.userData.phase, marker.userData.markerStatus)
    marker.scale.setScalar(visual.scale)
    const markerMaterial = marker.material as SpriteMaterial
    markerMaterial.opacity = visual.opacity
    markerMaterial.color.copy(markerFrameColor.setHex(visual.color))
  }
  const rippleCycle = now / 3200
  for (const { ripple, phase } of signalRipples) {
    const progress = (rippleCycle + phase) % 1
    const rippleMaterial = ripple.material as SpriteMaterial
    ripple.scale.setScalar(0.085 + progress * 0.17)
    rippleMaterial.opacity = Math.sin(progress * Math.PI) * 0.34 * surfaceFacingOpacity(ripple)
    rippleMaterial.color.copy(markerFrameColor.setHex(markerVisualState(pulseTime, ripple.userData.markerStatus).color))
  }
  const packetCycle = now / 4600
  for (const { curve, arcPulse, phase } of networkArcs) {
    const progress = (packetCycle + phase) % 1
    arcPulse.position.copy(curve.getPoint(progress))
    ;(arcPulse.material as SpriteMaterial).opacity = Math.sin(progress * Math.PI) * 0.88
  }
  if (visitorBeacon) {
    const beaconPulse = 0.94 + Math.sin(now * 0.0036) * 0.13
    visitorBeacon.scale.setScalar(0.11 * beaconPulse)
  }
  for (const marker of breathingMarkers) {
    const markerMaterial = marker.material as SpriteMaterial
    markerMaterial.opacity *= surfaceFacingOpacity(marker)
  }
  if (visitorBeacon) {
    const visitorMaterial = visitorBeacon.material as SpriteMaterial
    visitorMaterial.opacity = 0.96 * surfaceFacingOpacity(visitorBeacon)
  }
  for (const { arcPulse } of networkArcs) {
    const pulseMaterial = arcPulse.material as SpriteMaterial
    pulseMaterial.opacity *= surfaceFacingOpacity(arcPulse)
  }
  renderer.render(scene, camera)
  syncOverlayPositions()
}

const { pause: pauseRaf, resume: resumeRaf } = useRafFn(renderFrame, { immediate: false, fpsLimit: GLOBE_FPS })

function syncRafState() {
  if (shouldRender.value)
    resumeRaf()
  else
    pauseRaf()
}

function startGlobe() {
  if (!canvasRef.value)
    return
  scene = new Scene()
  camera = new PerspectiveCamera(36, 1, 0.1, 100)
  camera.position.set(0, 0, 3.05)
  renderer = new WebGLRenderer({ canvas: canvasRef.value, antialias: true, alpha: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.outputColorSpace = 'srgb'
  renderer.setClearColor(0x000000, 0)

  viewPitchGroup = new Group()
  axialTiltGroup = new Group()
  earthGroup = new Group()
  const persistedPosition = readPersistedGlobePosition()
  targetRotationY = persistedPosition?.rotationY ?? rotationFacingLargestRegion()
  defaultRotationY = targetRotationY
  targetViewPitch = persistedPosition?.pitch ?? INITIAL_VIEW_PITCH
  lastReleaseAt = performance.now()
  lastFrameAt = 0
  returningToDefault = false
  viewPitchGroup.rotation.x = INITIAL_VIEW_PITCH
  axialTiltGroup.rotation.z = EARTH_AXIAL_TILT_RAD
  earthGroup.rotation.y = targetRotationY
  earthGroup.scale.setScalar(1)
  axialTiltGroup.add(earthGroup)
  viewPitchGroup.add(axialTiltGroup)
  scene.add(viewPitchGroup)

  const geometry = new SphereGeometry(EARTH_RADIUS, 96, 64)
  const texture = new TextureLoader().load(EARTH_TEXTURE_URL, () => renderer?.render(scene!, camera!))
  texture.colorSpace = 'srgb'
  texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8)
  const sunDirection = new Vector3(...getSunDirection()).normalize()
  earthFixedSunDirection.copy(sunDirection)
  lastSolarUpdate = Date.now()
  earthMesh = new Mesh(geometry, new ShaderMaterial({
    uniforms: {
      earthMap: { value: texture },
      sunDirection: { value: sunDirection },
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vObjectNormal;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vUv = uv;
        vObjectNormal = normalize(normal);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `,
    fragmentShader: `
      uniform sampler2D earthMap;
      uniform vec3 sunDirection;
      varying vec2 vUv;
      varying vec3 vObjectNormal;
      varying vec3 vWorldNormal;
      varying vec3 vWorldPosition;
      void main() {
        vec3 normalDirection = normalize(vObjectNormal);
        vec3 worldNormalDirection = normalize(vWorldNormal);
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float lightAmount = dot(normalDirection, normalize(sunDirection));
        float dayFactor = smoothstep(-0.055, 0.085, lightAmount);
        vec3 textureColor = texture2D(earthMap, vUv).rgb;
        vec3 gradedTexture = pow(max(textureColor, vec3(0.0)), vec3(0.60));
        float luminance = dot(gradedTexture, vec3(0.2126, 0.7152, 0.0722));
        float blueDominance = gradedTexture.b - max(gradedTexture.r, gradedTexture.g);
        float oceanMask = smoothstep(0.001, 0.025, blueDominance) * smoothstep(0.008, 0.08, gradedTexture.b);
        vec3 daySaturation = mix(vec3(luminance), gradedTexture, 1.30);
        vec3 amapOcean = mix(vec3(0.003, 0.22, 0.64), vec3(0.006, 0.40, 0.92), smoothstep(0.015, 0.38, luminance));
        vec3 amapLand = pow(max(daySaturation, vec3(0.0)), vec3(0.82)) * vec3(1.12, 1.16, 0.96);
        // Reduce only the ocean's blue channel by 10%, keeping land and route colors unchanged.
        vec3 amapDaySurface = mix(amapLand, amapOcean, oceanMask);
        vec3 nightOcean = vec3(0.002, 0.055, 0.20) + amapOcean * 0.055;
        vec3 nightLand = mix(vec3(luminance), amapLand, 0.46) * vec3(0.10, 0.19, 0.31) + vec3(0.004, 0.010, 0.022);
        vec3 nightSurface = mix(nightLand, nightOcean, oceanMask);
        vec3 daySurface = amapDaySurface * mix(0.96, 1.12, max(lightAmount, 0.0));
        float terminatorGlow = exp(-pow(lightAmount / 0.115, 2.0));
        vec3 duskColor = vec3(0.035, 0.105, 0.18) * terminatorGlow * 0.34;
        vec3 surfaceColor = mix(nightSurface, daySurface, dayFactor) + duskColor;
        surfaceColor.b *= mix(1.0, 0.90, oceanMask);
        float facing = max(dot(worldNormalDirection, viewDirection), 0.0);
        float limbDarkening = mix(0.80, 1.0, pow(facing, 0.40));
        gl_FragColor = vec4(surfaceColor * limbDarkening, 1.0);
      }
    `,
  }))
  earthGroup.add(earthMesh)
  loadCountryBorders().catch(error => console.warn('[Globe] country borders unavailable', error))

  atmosphereMesh = new Mesh(
    new SphereGeometry(1.022, 96, 64),
    new ShaderMaterial({
      side: BackSide,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
      uniforms: {
        glowColor: { value: new Color(0x168DFF) },
        sunDirection: { value: sunDirection },
      },
      vertexShader: `
        varying vec3 vObjectNormal;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;
        void main() {
          vObjectNormal = normalize(normal);
          vWorldNormal = normalize(mat3(modelMatrix) * normal);
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform vec3 sunDirection;
        varying vec3 vObjectNormal;
        varying vec3 vWorldNormal;
        varying vec3 vWorldPosition;
        void main() {
          vec3 normalDirection = normalize(vObjectNormal);
          vec3 worldNormalDirection = normalize(vWorldNormal);
          vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
          float fresnel = pow(1.0 - abs(dot(worldNormalDirection, viewDirection)), 3.4);
          float sunlight = smoothstep(0.06, 0.52, dot(normalDirection, normalize(sunDirection)));
          float intensity = fresnel * sunlight * 0.58;
          gl_FragColor = vec4(glowColor * intensity, intensity * 0.28);
        }
      `,
    }),
  )
  earthGroup.add(atmosphereMesh)

  const sunlight = new DirectionalLight(0xFFF7E8, 0.35)
  sunlight.position.copy(sunDirection).multiplyScalar(5)
  scene.add(sunlight)

  starField = createStarField()
  scene.add(starField)
  rebuildDataLayers()
  resizeRenderer()
  syncRafState()
}

function stopGlobe() {
  pauseRaf()
  boundaryLoadToken += 1
  if (earthGroup)
    disposeObject(earthGroup)
  if (starField)
    disposeObject(starField)
  renderer?.dispose()
  renderer = null
  scene = null
  camera = null
  viewPitchGroup = null
  axialTiltGroup = null
  earthGroup = null
  earthMesh = null
  atmosphereMesh = null
  starField = null
  countryBorders = null
  breathingMarkers.length = 0
  signalRipples.length = 0
  networkArcs.length = 0
  visitorBeacon = null
}

function setClusterOverlayEl(code: string, el: Element | ComponentPublicInstance | null) {
  if (el instanceof HTMLDivElement) {
    el.style.willChange = 'transform, opacity, filter'
    clusterOverlayEls.set(code, el)
    nextTick(syncOverlayPositions)
  }
  else {
    clusterOverlayEls.delete(code)
  }
}

function bindClusterOverlayRef(id: string) {
  const existing = clusterOverlayRefBinders.get(id)
  if (existing)
    return existing
  const binder = (el: Element | ComponentPublicInstance | null) => setClusterOverlayEl(id, el)
  clusterOverlayRefBinders.set(id, binder)
  return binder
}

function bindClusterLeaderRef(id: string, el: Element | ComponentPublicInstance | null) {
  if (el instanceof SVGLineElement)
    clusterLeaderEls.set(id, el)
  else clusterLeaderEls.delete(id)
}
function bindClusterAnchorRef(id: string, el: Element | ComponentPublicInstance | null) {
  if (el instanceof SVGCircleElement)
    clusterAnchorEls.set(id, el)
  else clusterAnchorEls.delete(id)
}

function onPointerDown(event: PointerEvent) {
  pointerStartX = event.clientX
  pointerStartY = event.clientY
  pointerDragged = false
  isPointerDown = true
  returningToDefault = false
  lastPointerX = event.clientX
  lastPointerY = event.clientY
  ;(event.currentTarget as HTMLElement).setPointerCapture(event.pointerId)
}
function onPointerMove(event: PointerEvent) {
  if (!isPointerDown)
    return
  targetRotationY += (event.clientX - lastPointerX) / 180
  if (Math.hypot(event.clientX - pointerStartX, event.clientY - pointerStartY) > 6)
    pointerDragged = true
  targetViewPitch = Math.max(-0.65, Math.min(0.65, targetViewPitch + (event.clientY - lastPointerY) / 240))
  lastPointerX = event.clientX
  lastPointerY = event.clientY
}
function onPointerUp(event: PointerEvent) {
  isPointerDown = false
  lastReleaseAt = performance.now()
  persistGlobePosition()
  const target = event.currentTarget as HTMLElement
  if (target.hasPointerCapture(event.pointerId))
    target.releasePointerCapture(event.pointerId)
  if (event.type === 'pointerup' && pointerCity && !pointerDragged)
    cityClick(pointerCity)
  pointerCity = null
}

onMounted(() => {
  startGlobe()
  document.addEventListener('pointerdown', outsidePointerDown)
})
onBeforeUnmount(() => {
  stopGlobe()
  document.removeEventListener('pointerdown', outsidePointerDown)
})
watch([containerWidth, containerHeight], resizeRenderer)
watch(shouldRender, syncRafState)
watch([() => regionClusters.value.map(c => `${c.id}:${c.coord[0]},${c.coord[1]}:${c.servers}:${c.onlineServers}`).join(','), userCoord], async () => {
  rebuildDataLayers()
  await nextTick()
  syncOverlayPositions()
})
</script>

<template>
  <div
    ref="containerRef"
    class="realistic-earth relative mx-auto"
    :class="props.immersive ? 'h-[calc(100svh-8rem)] min-h-[28rem] w-full max-h-[calc(100svh-8rem)] max-w-[min(100%,52rem)] md:h-[calc(100vh-5rem)] md:max-h-none md:max-w-5xl' : 'aspect-square w-full max-w-[20rem] sm:max-w-[23rem] md:max-w-[24rem] xl:max-w-[32rem]'"
    @pointerdown="outsidePointerDown"
  >
    <canvas
      ref="canvasRef"
      class="earth-canvas absolute inset-0 size-full select-none touch-none cursor-grab active:cursor-grabbing"
      @pointerdown="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp"
    />

    <svg class="absolute inset-0 size-full pointer-events-none overflow-visible" aria-hidden="true">
      <g v-for="cluster in regionClusters" :key="cluster.id">
        <line :ref="el => bindClusterLeaderRef(cluster.id, el)" class="globe-label-leader" />
        <circle :ref="el => bindClusterAnchorRef(cluster.id, el)" class="globe-label-anchor" r="4" />
      </g>
    </svg>
    <template v-for="cluster in regionClusters" :key="cluster.id">
      <div :ref="bindClusterOverlayRef(cluster.id)" class="region-badge absolute top-0 left-0" :class="{ 'is-selected': selectedCityId === cluster.id }" role="button" tabindex="0" :aria-label="`${cluster.label} ${cluster.servers}台，查看城市详情`" :aria-expanded="selectedCityId === cluster.id" :title="cluster.id === cluster.code.toLowerCase() ? '国家级位置（IP 定位不可用）' : `${cluster.code} · ${cluster.id.slice(cluster.code.length + 1).replaceAll('-', ' ')} · 公网 IP 推测位置（非机场位置）`" @pointerdown.stop="cityPointerDown($event, cluster.id)" @pointermove="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp" @keydown.enter.prevent="cityClick(cluster.id)" @keydown.space.prevent="cityClick(cluster.id)">
        <div class="region-badge__surface">
          <div class="region-badge__header">
            <img class="region-badge__flag" :src="`/images/flags/${cluster.code}.svg`" :alt="`${countryNameFor(cluster.code)}国旗`">
            <span class="region-badge__country">{{ cluster.label }}</span>
            <span v-if="visitorSharesRegion && cluster.id === props.visitorCountryCode?.toLowerCase()" class="region-badge__you" title="根据公网 IP 推测网络出口，并非设备实际位置">您的位置</span>
            <span class="region-badge__count">{{ cluster.servers }}台</span>
          </div>
          <div class="region-badge__rates">
            <span class="text-emerald-600 dark:text-emerald-400"><Icon icon="tabler:arrow-up" width="11" height="11" />{{ formatRate(rateFor(cluster.id).up) }}</span>
            <span class="text-sky-600 dark:text-sky-400"><Icon icon="tabler:arrow-down" width="11" height="11" />{{ formatRate(rateFor(cluster.id).down) }}</span>
          </div>
        </div>
      </div>
    </template>

    <Teleport to="body">
      <section v-if="selectedCity" class="city-detail" aria-label="城市实时详情" @pointerdown.stop @keydown.esc="selectedCityId = null">
        <div class="city-detail__heading">
          <strong>{{ selectedCity.label }} · {{ selectedCity.servers }}台</strong><button type="button" aria-label="收起城市详情" @click="selectedCityId = null">
            ×
          </button>
        </div>
        <div class="city-detail__rates">
          <span>上行 ↑ {{ formatRate(rateFor(selectedCity.id).up) }}</span><span>下行 ↓ {{ formatRate(rateFor(selectedCity.id).down) }}</span>
        </div>
        <ul class="city-detail__members">
          <li v-for="node in selectedMembers" :key="node.uuid" :data-uuid="node.uuid">
            <span class="city-detail__name">{{ node.name }}</span><span :class="node.online ? 'text-emerald-600' : 'text-amber-600'">{{ node.online ? '在线' : '离线' }}</span>
          </li>
        </ul>
      </section>
    </Teleport>

    <div v-if="userCoord && !visitorSharesRegion" ref="visitorOverlayRef" class="visitor-location-badge absolute top-0 left-0 pointer-events-none" title="根据公网 IP 推测网络出口，并非设备实际位置">
      <Icon icon="tabler:current-location" width="12" height="12" />
      <span>您的位置</span>
    </div>

    <button
      type="button"
      class="absolute top-7 right-2 z-10 rounded-full border border-white/50 bg-white/78 px-2.5 py-1 text-[10px] font-semibold text-slate-600 shadow-sm backdrop-blur-md dark:border-sky-300/15 dark:bg-slate-950/70 dark:text-slate-300"
      aria-label="恢复地球默认视角"
      @click="clearPersistedGlobePosition"
    >
      复位
    </button>

    <div v-if="totalServers > 0" class="absolute top-7 md:top-12 left-2 pointer-events-none flex gap-2 items-center rounded-full border border-white/50 bg-white/78 px-2.5 py-1 text-[10px] shadow-sm backdrop-blur-md dark:border-sky-300/15 dark:bg-slate-950/70">
      <div v-if="onlineServers > 0" class="flex items-center gap-1">
        <span class="inline-block size-1.5 rounded-full bg-emerald-500 animate-pulse" /><span class="font-semibold text-emerald-600">在线 {{ onlineServers }}</span>
      </div>
      <div v-if="offlineServers > 0" class="flex items-center gap-1">
        <span class="inline-block size-1.5 rounded-full bg-amber-500" /><span class="font-semibold text-amber-600">离线 {{ offlineServers }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.region-badge.is-selected .region-badge__surface {
  outline: 2px solid #10b981;
  transform: scale(1.08);
}
.city-detail {
  position: fixed;
  z-index: 50;
  bottom: 12px;
  left: 12px;
  right: 12px;
  max-width: 360px;
  margin: auto;
  padding: 10px;
  border: 1px solid #34d399;
  border-radius: 12px;
  background: #ffffff;
  color: #1e293b;
  box-shadow: 0 8px 25px #0003;
}
.city-detail__heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
}
.city-detail__heading button {
  padding: 0 8px;
  font-size: 22px;
  cursor: pointer;
}
.city-detail__rates {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 6px 0;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
}
.city-detail__members {
  max-height: 120px;
  overflow-y: auto;
  overscroll-behavior: contain;
  margin: 0;
  padding: 0;
  list-style: none;
}
.city-detail__members li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
}
.city-detail__name {
  overflow-wrap: anywhere;
  white-space: normal;
}
:global(.dark .city-detail) {
  background: #071426;
  color: #e2e8f0;
}
:global(.dark .city-detail .text-emerald-600) {
  color: #34d399;
}
:global(.dark .city-detail .text-amber-600) {
  color: #fbbf24;
}
.earth-canvas {
  contain: layout paint;
  filter: saturate(0.84) contrast(0.832);
}
.region-badge {
  z-index: 5;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  min-width: 0;
  transition:
    opacity 180ms ease,
    filter 180ms ease;
  font-variant-numeric: tabular-nums;
}
.region-badge__surface {
  overflow: hidden;
  border: 1px solid rgb(255 255 255 / 64%);
  border-radius: 6px;
  background: rgb(255 255 255 / 88%);
  box-shadow: 0 6px 18px rgb(15 50 80 / 17%);
  backdrop-filter: blur(10px);
}
.region-badge__header {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 4px;
  color: rgb(30 41 59);
  font-size: 10px;
  line-height: 1;
}
.region-badge__flag {
  width: 14px;
  height: 10px;
  flex: none;
  border: 1px solid rgb(100 116 139 / 28%);
  border-radius: 2px;
  object-fit: cover;
  box-shadow: 0 1px 2px rgb(15 23 42 / 16%);
}
.region-badge__country {
  width: 32px;
  flex: none;
  max-width: 34px;
  overflow: hidden;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.region-badge__count {
  margin-left: auto;
  border-radius: 999px;
  padding: 1px 3px;
  background: rgb(14 165 233 / 13%);
  color: rgb(2 132 199);
  font-weight: 750;
  white-space: nowrap;
}
.region-badge__you {
  border-radius: 999px;
  padding: 2px 4px;
  background: rgb(254 240 138 / 50%);
  color: rgb(161 98 7);
  font-size: 9px;
  font-weight: 750;
  white-space: nowrap;
}
.region-badge__rates {
  display: none;
  grid-template-columns: 54px 54px;
  gap: 5px;
  border-top: 1px solid rgb(148 163 184 / 18%);
  padding: 2px 4px;
  font-size: 9px;
  line-height: 1;
  white-space: nowrap;
}
.region-badge__rates span {
  display: flex;
  align-items: center;
  gap: 1px;
}
.globe-label-leader {
  stroke: rgb(103 232 249 / 82%);
  stroke-width: 1.5;
  filter: drop-shadow(0 0 3px rgb(14 165 233 / 75%));
}
.globe-label-anchor {
  fill: rgb(34 211 238);
  stroke: white;
  stroke-width: 1.5;
  filter: drop-shadow(0 0 5px rgb(34 211 238 / 90%));
}
.visitor-location-badge {
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid rgb(253 224 71 / 72%);
  border-radius: 999px;
  padding: 4px 8px;
  background: rgb(255 251 235 / 94%);
  box-shadow: 0 4px 14px rgb(161 98 7 / 24%);
  color: rgb(161 98 7);
  font-size: 10px;
  font-weight: 800;
  white-space: nowrap;
  transition: opacity 180ms ease;
}
@media (max-width: 640px) {
  .region-badge {
    min-width: 0;
  }
  .region-badge__surface {
    border-radius: 7px;
    box-shadow: 0 3px 10px rgb(15 50 80 / 12%);
  }
  .region-badge__header {
    gap: 2px;
    padding: 2px 3px;
    font-size: 10px;
  }
  .region-badge__country {
    width: 32px;
    flex: none;
    max-width: 34px;
  }
  .region-badge__flag {
    width: 12px;
    height: 9px;
  }
  .region-badge__count {
    padding: 1px 3px;
  }
  .region-badge__you {
    font-size: 8px;
    padding: 1px 3px;
  }
  .region-badge__rates {
    display: none;
  }
}
:global(.dark) .visitor-location-badge {
  border-color: rgb(253 224 71 / 40%);
  background: rgb(66 52 14 / 92%);
  color: rgb(254 240 138);
}
:global(.dark) .region-badge__surface {
  border-color: rgb(125 211 252 / 20%);
  background: rgb(7 20 38 / 87%);
  box-shadow: 0 6px 20px rgb(0 0 0 / 36%);
}
:global(.dark) .region-badge__header {
  color: rgb(226 232 240);
}
:global(.dark) .region-badge__count {
  background: rgb(14 165 233 / 20%);
  color: rgb(125 211 252);
}
</style>
