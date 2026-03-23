export interface Translations {
  common: {
    backToHome: string;
    copyright: string;
    aboutUs: string;
    legalAndPrivacy: string;
    consents: string;
    contact: string;
    cookies: string;
    privacy: string;
    returns: string;
    security: string;
    shipping: string;
    terms: string;
    legalMenu: string;
    paymentsP24: string;
    loading: string;
    processing: string;
  };
  legalMenu: {
    title: string;
    subtitle: string;
    close: string;
    sections: {
      legal: string;
      payments: string;
      company: string;
    };
    paymentIntro: string;
    p24Terms: string;
    p24Privacy: string;
    comingSoon: string;
  };
  landing: {
    hero: {
      title: string;
      description: string;
    };
    cta: {
      button: string;
    };
  };
  processTimeline: {
    title: string;
    steps: {
      upload: {
        title: string;
        description: string;
      };
      adjust: {
        title: string;
        description: string;
      };
      order: {
        title: string;
        description: string;
      };
      result: {
        title: string;
        description: string;
      };
    };
  };
  about: {
    title: string;
    subtitle: string;
    mission: {
      title: string;
      description: string;
    };
    story: {
      title: string;
      description: string;
    };
    whatWeDo: {
      title: string;
      aiEnhancement: {
        label: string;
        description: string;
      };
      canvasPrinting: {
        label: string;
        description: string;
      };
      customFraming: {
        label: string;
        description: string;
      };
    };
    values: {
      title: string;
      qualityFirst: {
        label: string;
        description: string;
      };
      customerSatisfaction: {
        label: string;
        description: string;
      };
      innovation: {
        label: string;
        description: string;
      };
      sustainability: {
        label: string;
        description: string;
      };
    };
    contact: {
      title: string;
      description: string;
      email: string;
      phone: string;
      address: string;
    };
    lastUpdated: string;
  };
  legal: {
    title: string;
    subtitle: string;
    privacyPolicy: {
      title: string;
      description: string;
      dataCollection: {
        label: string;
        description: string;
      };
      dataStorage: {
        label: string;
        description: string;
      };
      dataUsage: {
        label: string;
        description: string;
      };
      dataRetention: {
        label: string;
        description: string;
      };
    };
    termsOfService: {
      title: string;
      description: string;
      serviceUse: {
        label: string;
        description: string;
      };
      contentOwnership: {
        label: string;
        description: string;
      };
      refundPolicy: {
        label: string;
        description: string;
      };
      limitationOfLiability: {
        label: string;
        description: string;
      };
    };
    contact: {
      title: string;
      description: string;
      email: string;
      phone: string;
      address: string;
    };
    lastUpdated: string;
  };
  upload: {
    success: string;
    error: string;
    uploadFailed: string;
    batchUploadSuccess: string;
    batchUploadFailed: string;
    partialUploadSummary: string;
    dropFile: string;
    uploading: string;
    uploadingSlotProgress: string;
    clickToUpload: string;
    fileSupport: string;
    uploadedPhoto: string;
    dimensions: string;
    size: string;
    noAdjustments: string;
    appliedAdjustments: string;
    rotation: string;
    flipHorizontal: string;
    flipVertical: string;
    brightness: string;
    contrast: string;
    grayscale: string;
    blur: string;
    loadingPreview: string;
    loadingPreviewProgress: string;
    applyingCropProgress: string;
    aiAdjustmentsTitle: string;
    aiAdjustmentsHint: string;
    aiTemplateLabel: string;
    aiEnhance: string;
    aiRemoveBackground: string;
    aiUpscale: string;
    aiRestore: string;
    previewAi: string;
    previewOriginal: string;
    previewYourImage: string;
    previewOriginalTab: string;
    showOriginal: string;
    showAiVersion: string;
    previewModeTitle: string;
    cropModeTitle: string;
    cropManual: string;
    cropAuto: string;
    cropHint: string;
    applyCrop: string;
    previewAiActive: string;
    previewOriginalActive: string;
    aiPreviewError: string;
    openPreviewUrl: string;
    openUploadedImage: string;
    uploadedSlotsTitle: string;
    slotLeft: string;
    slotCenter: string;
    slotRight: string;
    slotUploadFailed: string;
    usedCloudinaryTools: string;
    noCloudinaryTools: string;
  };
  uploader: {
    cropImage: string;
    adjustImage: string;
    dragCropArea: string;
    confirmCrop: string;
    backToCrop: string;
    cancel: string;
    uploadPhoto: string;
    uploading: string;
    uploadingProgress: string;
    imageAdjustments: string;
    previewEffectsTitle: string;
    previewEffectsDescription: string;
    previewEffectsButton: string;
    brightness: string;
    contrast: string;
    effectsReset: string;
    rotation: string;
    rotateMinus90: string;
    rotatePlus90: string;
    flip: string;
    horizontal: string;
    vertical: string;
    blackAndWhite: string;
    resetAllAdjustments: string;
    previousImage: string;
    nextImage: string;
    previewSlotNavigation: string;
    selectImageSlot: string;
    addImageSlot: string;
    removeImageSlot: string;
    clearSlot: string;
    emptyCenterSlotPlaceholder: string;
    uploadSelectedSlots: string;
    uploadSelectedSlotsConfirmTitle: string;
    uploadSelectedSlotsConfirmDescription: string;
    uploadSelectedSlotsConfirmAction: string;
    resetSlots: string;
    resetShort: string;
    splitSelectedImage: string;
    splitSlotsConfirmTitle: string;
    splitSlotsConfirmDescription: string;
    splitSlotsConfirmAction: string;
    resetSlotsConfirmTitle: string;
    resetSlotsConfirmDescription: string;
    resetSlotsConfirmAction: string;
    debugTitle: string;
    debugImageSize: string;
    debugImageRatio: string;
    debugCurrentFrame: string;
    debugSuggestedFrame: string;
    debugHorizontalCoverage: string;
    debugVerticalCoverage: string;
    debugRectangleCoverage: string;
    debugUnknown: string;
    maxImagesError: string;
  };
  checkout: {
    title: string;
    subtitle: string;
    orderSuccessful: string;
    orderSuccessMessage: string;
    redirecting: string;
    shippingInformation: string;
    personalInformation: string;
    fullName: string;
    fullNamePlaceholder: string;
    addressInformation: string;
    streetAddress: string;
    streetAddressPlaceholder: string;
    city: string;
    cityPlaceholder: string;
    postalCode: string;
    postalCodePlaceholder: string;
    country: string;
    countryPlaceholder: string;
    orderSummary: string;
    uploadedImages: string;
    enhancedPhoto: string;
    canvasPrint: string;
    total: string;
    openCheckout: string;
    placeOrder: string;
    requiredFields: string;
    errorName: string;
    errorAddress: string;
    errorGeneric: string;
  };
}

export type TranslationKey = keyof Translations;
export type Language = 'en' | 'pl';
