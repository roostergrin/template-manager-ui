/**
 * Utility functions for preserving doctor photos during image updates
 *
 * Doctor photos are identified by:
 * - Field paths matching patterns like doctor.photo, team.*.photo, staff.*.image
 * - Components/fields with preserve_image: true flag
 * - Image fields in specific sections (about, team, doctor)
 */

// Patterns that identify doctor/team photo fields
const DOCTOR_PHOTO_PATTERNS = [
  /^doctor\.photo$/i,
  /^doctor\.image$/i,
  /^team\.\d+\.photo$/i,
  /^team\.\d+\.image$/i,
  /^staff\.\d+\.photo$/i,
  /^staff\.\d+\.image$/i,
  /^doctors\.\d+\.photo$/i,
  /^doctors\.\d+\.image$/i,
  /^provider\.photo$/i,
  /^provider\.image$/i,
  /^providers\.\d+\.photo$/i,
  /^providers\.\d+\.image$/i,
  /^about\.doctor\.photo$/i,
  /^about\.doctor\.image$/i,
  /^meet.*doctor.*\.image$/i,
  /^meet.*doctor.*\.photo$/i,
];

// Component types that typically contain doctor photos
const DOCTOR_COMPONENT_TYPES = [
  'doctor_bio',
  'team_member',
  'provider_card',
  'staff_profile',
  'meet_doctor',
  'about_doctor',
  'team_grid',
  'staff_grid',
];

interface ImageField {
  path: string;
  src: string;
  alt?: string;
  preserveImage?: boolean;
}

interface PreservedPhoto {
  path: string;
  originalSrc: string;
  originalAlt?: string;
}

/**
 * Check if a field path matches doctor photo patterns
 */
export const isDoctorPhotoPath = (path: string): boolean => {
  return DOCTOR_PHOTO_PATTERNS.some(pattern => pattern.test(path));
};

/**
 * Check if a component type typically contains doctor photos
 */
export const isDoctorComponentType = (componentType: string): boolean => {
  return DOCTOR_COMPONENT_TYPES.some(
    type => componentType.toLowerCase().includes(type.toLowerCase())
  );
};

/**
 * Extract all doctor photos from page data before image picker runs
 */
export const extractDoctorPhotos = (pageData: Record<string, unknown>): PreservedPhoto[] => {
  const preserved: PreservedPhoto[] = [];

  const traverse = (obj: unknown, currentPath: string = ''): void => {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        traverse(item, `${currentPath}.${index}`);
      });
      return;
    }

    const record = obj as Record<string, unknown>;

    // Check for preserve_image flag
    if (record.preserve_image === true && record.src) {
      preserved.push({
        path: currentPath,
        originalSrc: record.src as string,
        originalAlt: record.alt as string | undefined,
      });
      return;
    }

    // Check if this is an image field with src
    if (record.src && typeof record.src === 'string') {
      const cleanPath = currentPath.replace(/^\./, '');

      // Check if path matches doctor photo patterns
      if (isDoctorPhotoPath(cleanPath)) {
        preserved.push({
          path: cleanPath,
          originalSrc: record.src,
          originalAlt: record.alt as string | undefined,
        });
      }
    }

    // Check for acf_fc_layout (component type) to identify doctor components
    if (record.acf_fc_layout && typeof record.acf_fc_layout === 'string') {
      if (isDoctorComponentType(record.acf_fc_layout)) {
        // Find any image fields in this component
        const findImages = (subObj: unknown, subPath: string): void => {
          if (!subObj || typeof subObj !== 'object') return;

          if (Array.isArray(subObj)) {
            subObj.forEach((item, index) => findImages(item, `${subPath}.${index}`));
            return;
          }

          const subRecord = subObj as Record<string, unknown>;
          if (subRecord.src && typeof subRecord.src === 'string') {
            const cleanSubPath = subPath.replace(/^\./, '');
            // Check if it looks like a photo field (contains image, photo, headshot, portrait)
            if (/image|photo|headshot|portrait/i.test(cleanSubPath)) {
              preserved.push({
                path: cleanSubPath,
                originalSrc: subRecord.src,
                originalAlt: subRecord.alt as string | undefined,
              });
            }
          }

          Object.entries(subRecord).forEach(([key, value]) => {
            if (key !== 'acf_fc_layout') {
              findImages(value, `${subPath}.${key}`);
            }
          });
        };

        Object.entries(record).forEach(([key, value]) => {
          if (key !== 'acf_fc_layout') {
            findImages(value, `${currentPath}.${key}`);
          }
        });
      }
    }

    // Recursively traverse
    Object.entries(record).forEach(([key, value]) => {
      traverse(value, `${currentPath}.${key}`);
    });
  };

  Object.entries(pageData).forEach(([pageName, pageContent]) => {
    traverse(pageContent, pageName);
  });

  // Remove duplicates
  const uniquePreserved = preserved.filter(
    (photo, index, self) =>
      index === self.findIndex(p => p.path === photo.path && p.originalSrc === photo.originalSrc)
  );

  return uniquePreserved;
};

/**
 * Restore doctor photos after image picker has run
 */
export const restoreDoctorPhotos = (
  pageData: Record<string, unknown>,
  preservedPhotos: PreservedPhoto[]
): Record<string, unknown> => {
  if (preservedPhotos.length === 0) return pageData;

  const result = JSON.parse(JSON.stringify(pageData)); // Deep clone

  preservedPhotos.forEach(photo => {
    const pathParts = photo.path.split('.');
    let current: unknown = result;

    // Navigate to the parent of the target
    for (let i = 0; i < pathParts.length - 1; i++) {
      const part = pathParts[i];
      if (current && typeof current === 'object') {
        const obj = current as Record<string, unknown>;
        if (obj[part] !== undefined) {
          current = obj[part];
        } else {
          // Path not found, skip
          current = null;
          break;
        }
      }
    }

    // Set the src value
    if (current && typeof current === 'object') {
      const obj = current as Record<string, unknown>;
      const lastPart = pathParts[pathParts.length - 1];

      if (obj[lastPart] && typeof obj[lastPart] === 'object') {
        const imgObj = obj[lastPart] as Record<string, unknown>;
        imgObj.src = photo.originalSrc;
        if (photo.originalAlt) {
          imgObj.alt = photo.originalAlt;
        }
      }
    }
  });

  return result;
};

/**
 * Mark all doctor photos with preserve_image flag for future reference
 */
export const markDoctorPhotosForPreservation = (
  pageData: Record<string, unknown>
): Record<string, unknown> => {
  const result = JSON.parse(JSON.stringify(pageData)); // Deep clone

  const markImages = (obj: unknown, path: string = ''): void => {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => markImages(item, `${path}.${index}`));
      return;
    }

    const record = obj as Record<string, unknown>;

    // Check if this is an image that should be preserved
    if (record.src && typeof record.src === 'string') {
      const cleanPath = path.replace(/^\./, '');
      if (isDoctorPhotoPath(cleanPath)) {
        record.preserve_image = true;
      }
    }

    // Check for doctor component types
    if (record.acf_fc_layout && typeof record.acf_fc_layout === 'string') {
      if (isDoctorComponentType(record.acf_fc_layout)) {
        // Mark all images in this component
        const markSubImages = (subObj: unknown, subPath: string): void => {
          if (!subObj || typeof subObj !== 'object') return;

          if (Array.isArray(subObj)) {
            subObj.forEach((item, index) => markSubImages(item, `${subPath}.${index}`));
            return;
          }

          const subRecord = subObj as Record<string, unknown>;
          if (subRecord.src && typeof subRecord.src === 'string') {
            if (/image|photo|headshot|portrait/i.test(subPath)) {
              subRecord.preserve_image = true;
            }
          }

          Object.entries(subRecord).forEach(([key, value]) => {
            markSubImages(value, `${subPath}.${key}`);
          });
        };

        Object.entries(record).forEach(([key, value]) => {
          if (key !== 'acf_fc_layout') {
            markSubImages(value, `${path}.${key}`);
          }
        });
      }
    }

    Object.entries(record).forEach(([key, value]) => {
      markImages(value, `${path}.${key}`);
    });
  };

  Object.entries(result).forEach(([pageName, pageContent]) => {
    markImages(pageContent, pageName);
  });

  return result;
};

export default {
  isDoctorPhotoPath,
  isDoctorComponentType,
  extractDoctorPhotos,
  restoreDoctorPhotos,
  markDoctorPhotosForPreservation,
};
