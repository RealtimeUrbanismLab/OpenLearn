import {modelDescriptions, getSelectedIndex, setSelectedIndex} from './data.js'
import {openPopup} from './popup.js'
import {updateModelVisibility} from './selectcomponent.js'

// Safely update button visibility
const updateButtonVisibility = () => {
  const nextButton = document.getElementById('nextbutton')
  const backButton = document.getElementById('backbutton')
  const currentIndex = getSelectedIndex()

  if (backButton) {
    backButton.style.display = 'block'
    backButton.style.visibility = currentIndex > 0 ? 'visible' : 'hidden'
    backButton.style.pointerEvents = currentIndex > 0 ? 'auto' : 'none'
  }

  if (nextButton) {
    nextButton.style.display = 'block'
    nextButton.style.visibility = currentIndex < modelDescriptions.length - 1 ? 'visible' : 'hidden'
    nextButton.style.pointerEvents = currentIndex < modelDescriptions.length - 1 ? 'auto' : 'none'
  }
}

const nextButtonComponent = () => ({
  init() {
    let suppressClickUntil = 0

    const shouldHandleEvent = (event) => {
      const now = Date.now()

      if (event.type === 'click' && now < suppressClickUntil) {
        return false
      }

      if (event.type === 'pointerup' && (event.pointerType === 'touch' || event.pointerType === 'pen')) {
        suppressClickUntil = now + 700
      }

      return true
    }

    // Start/place buttons removed; navigation works without gating

    const bindNavButtons = () => {
      const nextButton = document.getElementById('nextbutton')
      const backButton = document.getElementById('backbutton')

      if (!nextButton || !backButton) return
      if (nextButton.dataset.bound === 'true' && backButton.dataset.bound === 'true') return

      const handleNext = (event) => {
        if (!shouldHandleEvent(event)) return
        event.preventDefault()
        event.stopPropagation()
        const currentIndex = getSelectedIndex()
        const nextIndex = currentIndex < 0 ? 0 : currentIndex + 1
        if (nextIndex < modelDescriptions.length) {
          setSelectedIndex(nextIndex)
          const nextModelId = modelDescriptions[nextIndex].Modelname
          openPopup(getSelectedIndex(), modelDescriptions)
          updateButtonVisibility()
          updateModelVisibility(nextModelId)
        }
      }

      const handleBack = (event) => {
        if (!shouldHandleEvent(event)) return
        event.preventDefault()
        event.stopPropagation()
        const currentIndex = getSelectedIndex()
        if (currentIndex > 0) {
          const prevIndex = currentIndex - 1
          setSelectedIndex(prevIndex)
          const prevModelId = modelDescriptions[prevIndex].Modelname
          openPopup(getSelectedIndex(), modelDescriptions)
          updateButtonVisibility()
          updateModelVisibility(prevModelId)
        }
      }

      nextButton.addEventListener('click', handleNext)
      nextButton.addEventListener('pointerup', handleNext)
      backButton.addEventListener('click', handleBack)
      backButton.addEventListener('pointerup', handleBack)

      nextButton.dataset.bound = 'true'
      backButton.dataset.bound = 'true'
    }

    bindNavButtons()
    this.el.addEventListener('loaded', bindNavButtons)
    document.addEventListener('DOMContentLoaded', bindNavButtons)
  },
})

export {nextButtonComponent, updateButtonVisibility}
