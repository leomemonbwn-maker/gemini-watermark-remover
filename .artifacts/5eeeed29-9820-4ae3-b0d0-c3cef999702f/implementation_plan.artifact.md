# AI Restore Feature Implementation Plan

Implement a new "AI Restore" (AI Refine) feature to handle cases where the mathematical removal leaves halke "ghost" artifacts. This will use a smart local inpainting/smoothing algorithm on the detected watermark area.

## Proposed Changes

### UI & UX
#### [MODIFY] [ImageRemover.vue](file:///C:/Users/dell/StudioProjects/gemini-watermark-remover/src/components/ImageRemover.vue)
- Add "AI Refine" button in the item controls.
- Implement `refineImage(item)` function.
- Add a processing state specifically for refinement.
- Show a "Success" animation when refinement is done.

#### [MODIFY] [i18n.js](file:///C:/Users/dell/StudioProjects/gemini-watermark-remover/src/config/i18n.js)
- Add translations for "AI Refine", "Refining...", and "Refinement Done".

### Logic & Engine
#### [NEW] [refiner.js](file:///C:/Users/dell/StudioProjects/gemini-watermark-remover/src/engine/refiner.js)
- Create a utility to apply smart smoothing/inpainting on a specific `ImageData` region using the detected watermark coordinates.
- It will use a combination of halke box-blur and edge-preserving filters to hide ghosting.

## Verification Plan

### Manual Verification
- Upload a Gemini image with a complex background.
- Apply "Standard Clean".
- Click "AI Refine" and verify that the "ghost" area becomes smoother and less visible.
- Check that the download still works perfectly with the refined image.
