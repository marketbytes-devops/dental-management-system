/**
 * Utility functions for parsing, normalizing, and filtering doctor specialties.
 */

/**
 * Normalizes a doctor's specialty data into an array of individual specialty strings.
 * Handles JSON arrays, comma-separated strings, single strings, or undefined/null values.
 *
 * @param {Object|Array|String} docOrSpecialty - Doctor object or raw specialty field.
 * @returns {Array<string>} Array of clean, trimmed specialty names.
 */
export function parseDoctorSpecialties(docOrSpecialty) {
  let raw = docOrSpecialty;
  if (docOrSpecialty && typeof docOrSpecialty === "object" && !Array.isArray(docOrSpecialty)) {
    raw = docOrSpecialty.specialties || docOrSpecialty.specialty;
  }

  if (!raw) return ["General Dentistry"];

  let result = [];

  if (Array.isArray(raw)) {
    result = raw;
  } else if (typeof raw === "string") {
    // Try to parse JSON if stringified array
    if (raw.trim().startsWith("[")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) result = parsed;
        else result = [raw];
      } catch (e) {
        result = raw.split(",");
      }
    } else if (raw.includes(",")) {
      result = raw.split(",");
    } else {
      result = [raw];
    }
  }

  const cleaned = result
    .map((s) => (typeof s === "string" ? s.trim() : ""))
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : ["General Dentistry"];
}

/**
 * Extracts, flattens, and deduplicates all unique atomic specialties across a list of doctors.
 *
 * @param {Array<Object>} doctors - Array of doctor objects.
 * @returns {Array<string>} Alphabetically sorted array of unique individual specialties.
 */
export function getAllUniqueSpecialties(doctors = []) {
  const set = new Set();
  doctors.forEach((doc) => {
    const specs = parseDoctorSpecialties(doc);
    specs.forEach((s) => set.add(s));
  });

  const list = Array.from(set).filter(Boolean);
  return list.length > 0 ? list.sort() : ["General Dentistry"];
}

/**
 * Checks whether a doctor possesses a target specialty (case-insensitive).
 *
 * @param {Object} doc - Doctor object.
 * @param {string} targetSpecialty - Selected specialty filter value.
 * @returns {boolean} True if targetSpecialty matches any of the doctor's specialties.
 */
export function doctorHasSpecialty(doc, targetSpecialty) {
  if (!targetSpecialty || targetSpecialty.trim() === "") return true;
  const docSpecs = parseDoctorSpecialties(doc);
  const targetLower = targetSpecialty.trim().toLowerCase();
  return docSpecs.some((s) => s.toLowerCase() === targetLower);
}
