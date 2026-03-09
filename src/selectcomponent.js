import {modelDescriptions, setSelectedIndex} from './data.js'
import {openPopup, closePopup} from './popup.js'
import {updateButtonVisibility} from './next-button.js'

const originalMaterials = new Map()
const DIM_OPACITY = 0.3
const DIM_COLOR_SCALE = 0.78
const DIM_EMISSIVE_SCALE = 0.5
const DIM_SHADER_OPACITY_SCALE = 0.7
const DIM_SHADER_INTENSITY_SCALE = 0.78

const getSafeColor = (material) => {
  if (material && material.color && material.color.isColor) return material.color.clone()
  return new THREE.Color(0xffffff)
}

const getSafeEmissive = (material) => {
  if (material && material.emissive && material.emissive.isColor) return material.emissive.clone()
  return new THREE.Color(0x000000)
}

const getSafeShaderUniformColor = (uniformValue, fallbackColor) => {
  if (uniformValue && uniformValue.isColor) return uniformValue.clone()
  return new THREE.Color(fallbackColor)
}

function cacheOriginalMaterials(modelElement) {
  const mesh = modelElement.getObject3D('mesh')
  if (!mesh) return
  mesh.traverse((node) => {
    if (!node.isMesh && !node.isSkinnedMesh) return
    const material = node.material
    if (!material) return
    if (!originalMaterials.has(node)) {
      originalMaterials.set(node, {
        transparent: material.transparent,
        opacity: typeof material.opacity === 'number' ? material.opacity : 1,
        depthWrite: material.depthWrite,
        depthTest: material.depthTest,
        color: getSafeColor(material),
        emissive: getSafeEmissive(material),
        emissiveIntensity: material.emissiveIntensity || 0,
        shaderOpacity: typeof material.uniforms?.uOpacity?.value === 'number'
          ? material.uniforms.uOpacity.value
          : null,
        shaderInnerColor: getSafeShaderUniformColor(material.uniforms?.uInnerColor?.value, 0xff2a2a),
        shaderOuterColor: getSafeShaderUniformColor(material.uniforms?.uOuterColor?.value, 0x7a0000),
        shaderIntensity: typeof material.uniforms?.uIntensity?.value === 'number'
          ? material.uniforms.uIntensity.value
          : null,
      })
    }
  })
}


export function setOpacity(modelElement, opacity, dimmed = false) {
  const mesh = modelElement.getObject3D('mesh')
  if (!mesh) return
  mesh.traverse((node) => {
    if (!node.isMesh && !node.isSkinnedMesh) return
    const material = node.material
    if (!material) return
    if (!originalMaterials.has(node)) {
      originalMaterials.set(node, {
        transparent: material.transparent,
        opacity: typeof material.opacity === 'number' ? material.opacity : 1,
        depthWrite: material.depthWrite,
        depthTest: material.depthTest,
        color: getSafeColor(material),
        emissive: getSafeEmissive(material),
        emissiveIntensity: material.emissiveIntensity || 0,
        shaderOpacity: typeof material.uniforms?.uOpacity?.value === 'number'
          ? material.uniforms.uOpacity.value
          : null,
        shaderInnerColor: getSafeShaderUniformColor(material.uniforms?.uInnerColor?.value, 0xff2a2a),
        shaderOuterColor: getSafeShaderUniformColor(material.uniforms?.uOuterColor?.value, 0x7a0000),
        shaderIntensity: typeof material.uniforms?.uIntensity?.value === 'number'
          ? material.uniforms.uIntensity.value
          : null,
      })
    }
    const original = originalMaterials.get(node)

    if (dimmed) {
      material.transparent = true
      material.opacity = Math.min(opacity, original.opacity)
      material.depthWrite = false

      if (material.color && material.color.isColor) {
        material.color.copy(original.color).multiplyScalar(DIM_COLOR_SCALE)
      }

      if (material.emissive && material.emissive.isColor) {
        material.emissive.copy(original.emissive).multiplyScalar(DIM_EMISSIVE_SCALE)
        material.emissiveIntensity = original.emissiveIntensity * DIM_EMISSIVE_SCALE
      }

      if (material.uniforms?.uOpacity && typeof original.shaderOpacity === 'number') {
        material.uniforms.uOpacity.value = original.shaderOpacity * DIM_SHADER_OPACITY_SCALE
      }

      if (material.uniforms?.uInnerColor?.value && material.uniforms.uInnerColor.value.isColor) {
        material.uniforms.uInnerColor.value.copy(original.shaderInnerColor).multiplyScalar(DIM_COLOR_SCALE)
      }

      if (material.uniforms?.uOuterColor?.value && material.uniforms.uOuterColor.value.isColor) {
        material.uniforms.uOuterColor.value.copy(original.shaderOuterColor).multiplyScalar(DIM_COLOR_SCALE)
      }

      if (material.uniforms?.uIntensity && typeof original.shaderIntensity === 'number') {
        material.uniforms.uIntensity.value = original.shaderIntensity * DIM_SHADER_INTENSITY_SCALE
      }
    } else {
      material.transparent = original.transparent
      material.opacity = original.opacity
      material.depthWrite = original.depthWrite
      material.depthTest = original.depthTest

      if (material.color && material.color.isColor) {
        material.color.copy(original.color)
      }

      if (material.emissive && material.emissive.isColor) {
        material.emissive.copy(original.emissive)
        material.emissiveIntensity = original.emissiveIntensity
      }

      if (material.uniforms?.uOpacity && typeof original.shaderOpacity === 'number') {
        material.uniforms.uOpacity.value = original.shaderOpacity
      }

      if (material.uniforms?.uInnerColor?.value && material.uniforms.uInnerColor.value.isColor) {
        material.uniforms.uInnerColor.value.copy(original.shaderInnerColor)
      }

      if (material.uniforms?.uOuterColor?.value && material.uniforms.uOuterColor.value.isColor) {
        material.uniforms.uOuterColor.value.copy(original.shaderOuterColor)
      }

      if (material.uniforms?.uIntensity && typeof original.shaderIntensity === 'number') {
        material.uniforms.uIntensity.value = original.shaderIntensity
      }
    }

    material.needsUpdate = true
  })
}

export function updateModelVisibility(selectedModelId) {
  document.querySelectorAll('[gltf-model]').forEach((el) => {
    if (el.id === selectedModelId) {
      setOpacity(el, 1, false)
    } else {
      setOpacity(el, DIM_OPACITY, true)
    }
  })
}

export function resetModelOpacity() {
  originalMaterials.forEach((mat, node) => {
    const material = node.material
    if (!material) return

    material.transparent = mat.transparent
    material.opacity = mat.opacity
    material.depthWrite = mat.depthWrite
    material.depthTest = mat.depthTest

    if (material.color && material.color.isColor) {
      material.color.copy(mat.color)
    }

    if (material.emissive && material.emissive.isColor) {
      material.emissive.copy(mat.emissive)
      material.emissiveIntensity = mat.emissiveIntensity
    }

    if (material.uniforms?.uOpacity && typeof mat.shaderOpacity === 'number') {
      material.uniforms.uOpacity.value = mat.shaderOpacity
    }

    if (material.uniforms?.uInnerColor?.value && material.uniforms.uInnerColor.value.isColor) {
      material.uniforms.uInnerColor.value.copy(mat.shaderInnerColor)
    }

    if (material.uniforms?.uOuterColor?.value && material.uniforms.uOuterColor.value.isColor) {
      material.uniforms.uOuterColor.value.copy(mat.shaderOuterColor)
    }

    if (material.uniforms?.uIntensity && typeof mat.shaderIntensity === 'number') {
      material.uniforms.uIntensity.value = mat.shaderIntensity
    }

    material.needsUpdate = true
  })
}

export const selectComponent = {
  init() {
    const scene = this.el
    let currentlySelected = null
    let locked = false

    scene.addEventListener('loaded', () => {
      document.querySelectorAll('.cantap').forEach((modelElement) => {
        // Cache immediately if mesh exists
        cacheOriginalMaterials(modelElement)
        // Also wait for model-loaded in case mesh is async
        modelElement.addEventListener('model-loaded', () => {
          cacheOriginalMaterials(modelElement)
          // Model alignment removed to avoid shifting assets out of place
          if (modelElement.id === 'xray_tube') {
            const mesh = modelElement.getObject3D('mesh')
            if (mesh) {
              mesh.traverse((node) => {
                if (!node.isMesh && !node.isSkinnedMesh) return
                node.renderOrder = 10
              })
            }
          }
        })

        const handleSelect = (e) => {
          e.preventDefault()
          e.stopPropagation()
          if (locked) return
          locked = true
          setTimeout(() => (locked = false), 250)

          const modelId = modelElement.id

          if (currentlySelected === modelId) {
            currentlySelected = null
            // Close the popup and restore model visuals
            closePopup()
            setSelectedIndex(-1)
            updateButtonVisibility()
            return
          }

          const index = modelDescriptions.findIndex(d => d.Modelname === modelId)
          if (index === -1) return

          currentlySelected = modelId
          setSelectedIndex(index)
          openPopup(index, modelDescriptions)
          updateButtonVisibility()
          updateModelVisibility(modelId)
        }

        // Attach the select handler to the model element
        modelElement.addEventListener('click', handleSelect)
      })
    })
  },
}


