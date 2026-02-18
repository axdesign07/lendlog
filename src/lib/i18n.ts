export type Locale = "en" | "fr" | "ar" | "darija";

export const LOCALES: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "fr", label: "Fran\u00E7ais" },
  { value: "ar", label: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629" },
  { value: "darija", label: "\u062F\u0627\u0631\u064A\u062C\u0629" },
];

export function isRTL(locale: Locale): boolean {
  return locale === "ar" || locale === "darija";
}

const translations = {
  en: {
    // Header
    appName: "LendLog",
    toggleTheme: "Toggle theme",
    settings: "Settings",

    // Balance
    allSettled: "All settled up!",
    owesYou: (name: string) => `${name} owes you`,
    youOwe: (name: string) => `You owe ${name}`,

    // Filters
    all: "All",
    youLent: "You Lent",
    borrowed: "Borrowed",
    allCurrencies: "All Currencies",
    currency: "Currency",

    // Entry card
    youLentAmount: "You lent",
    youBorrowedAmount: "You borrowed",
    to: (name: string) => ` to ${name}`,
    from: (name: string) => ` from ${name}`,
    at: "at",

    // Empty state
    noEntries: "No entries yet",
    noEntriesDesc: "Tap the + button to log your first transaction",

    // Add entry sheet
    newEntry: "New Entry",
    editEntry: "Edit Entry",
    iLent: "I Lent",
    iBorrowed: "I Borrowed",
    amount: "Amount",
    noteOptional: "Note (optional)",
    notePlaceholder: "What was this for?",
    attachmentOptional: "Attachment (optional)",
    addPhoto: "Add photo or invoice",
    cancel: "Cancel",
    addEntry: "Add Entry",
    update: "Update",

    // Settings
    friendName: "Friend's name",
    friendNamePlaceholder: "e.g. Ahmed",
    language: "Language",
    save: "Save",

    // Image viewer
    attachedImage: "Attached image",

    // Loading
    loading: "Loading...",

    // Add entry button
    addEntryButton: "Add entry",

    // History
    history: "History",
    noHistory: "No history yet",
    auditCreated: "Created",
    auditUpdated: "Updated",
    auditDeleted: "Deleted",
    auditRestored: "Restored",
    restore: "Restore",

    // Export
    export: "Export",
    exportEntries: (count: number) => `${count} ${count === 1 ? "entry" : "entries"} in range`,
  },
  fr: {
    appName: "LendLog",
    toggleTheme: "Changer le th\u00E8me",
    settings: "Param\u00E8tres",

    allSettled: "Tout est r\u00E9gl\u00E9 !",
    owesYou: (name: string) => `${name} vous doit`,
    youOwe: (name: string) => `Vous devez \u00E0 ${name}`,

    all: "Tout",
    youLent: "Pr\u00EAt\u00E9",
    borrowed: "Emprunt\u00E9",
    allCurrencies: "Toutes les devises",
    currency: "Devise",

    youLentAmount: "Vous avez pr\u00EAt\u00E9",
    youBorrowedAmount: "Vous avez emprunt\u00E9",
    to: (name: string) => ` \u00E0 ${name}`,
    from: (name: string) => ` de ${name}`,
    at: "\u00E0",

    noEntries: "Aucune entr\u00E9e",
    noEntriesDesc: "Appuyez sur + pour ajouter votre premi\u00E8re transaction",

    newEntry: "Nouvelle entr\u00E9e",
    editEntry: "Modifier l'entr\u00E9e",
    iLent: "J'ai pr\u00EAt\u00E9",
    iBorrowed: "J'ai emprunt\u00E9",
    amount: "Montant",
    noteOptional: "Note (optionnel)",
    notePlaceholder: "C'\u00E9tait pour quoi ?",
    attachmentOptional: "Pi\u00E8ce jointe (optionnel)",
    addPhoto: "Ajouter une photo ou facture",
    cancel: "Annuler",
    addEntry: "Ajouter",
    update: "Mettre \u00E0 jour",

    friendName: "Nom de l'ami(e)",
    friendNamePlaceholder: "ex. Ahmed",
    language: "Langue",
    save: "Enregistrer",

    attachedImage: "Image jointe",
    loading: "Chargement...",
    addEntryButton: "Ajouter une entr\u00E9e",

    history: "Historique",
    noHistory: "Aucun historique",
    auditCreated: "Cr\u00E9\u00E9",
    auditUpdated: "Modifi\u00E9",
    auditDeleted: "Supprim\u00E9",
    auditRestored: "Restaur\u00E9",
    restore: "Restaurer",

    export: "Exporter",
    exportEntries: (count: number) => `${count} entr\u00E9e${count > 1 ? "s" : ""} dans la p\u00E9riode`,
  },
  ar: {
    appName: "LendLog",
    toggleTheme: "\u062A\u063A\u064A\u064A\u0631 \u0627\u0644\u0645\u0638\u0647\u0631",
    settings: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",

    allSettled: "\u0643\u0644 \u0634\u064A\u0621 \u0645\u064F\u0633\u0648\u0651\u0649!",
    owesYou: (name: string) => `${name} \u064A\u062F\u064A\u0646 \u0644\u0643`,
    youOwe: (name: string) => `\u0623\u0646\u062A \u062A\u062F\u064A\u0646 \u0644\u0640 ${name}`,

    all: "\u0627\u0644\u0643\u0644",
    youLent: "\u0623\u0642\u0631\u0636\u062A",
    borrowed: "\u0627\u0642\u062A\u0631\u0636\u062A",
    allCurrencies: "\u0643\u0644 \u0627\u0644\u0639\u0645\u0644\u0627\u062A",
    currency: "\u0627\u0644\u0639\u0645\u0644\u0629",

    youLentAmount: "\u0623\u0642\u0631\u0636\u062A",
    youBorrowedAmount: "\u0627\u0642\u062A\u0631\u0636\u062A",
    to: (name: string) => ` \u0644\u0640 ${name}`,
    from: (name: string) => ` \u0645\u0646 ${name}`,
    at: "\u0641\u064A",

    noEntries: "\u0644\u0627 \u062A\u0648\u062C\u062F \u0625\u062F\u062E\u0627\u0644\u0627\u062A",
    noEntriesDesc: "\u0627\u0636\u063A\u0637 \u0639\u0644\u0649 + \u0644\u062A\u0633\u062C\u064A\u0644 \u0623\u0648\u0644 \u0645\u0639\u0627\u0645\u0644\u0629",

    newEntry: "\u0625\u062F\u062E\u0627\u0644 \u062C\u062F\u064A\u062F",
    editEntry: "\u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0625\u062F\u062E\u0627\u0644",
    iLent: "\u0623\u0642\u0631\u0636\u062A",
    iBorrowed: "\u0627\u0642\u062A\u0631\u0636\u062A",
    amount: "\u0627\u0644\u0645\u0628\u0644\u063A",
    noteOptional: "\u0645\u0644\u0627\u062D\u0638\u0629 (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)",
    notePlaceholder: "\u0644\u0645\u0627\u0630\u0627 \u0643\u0627\u0646 \u0647\u0630\u0627\u061F",
    attachmentOptional: "\u0645\u0631\u0641\u0642 (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)",
    addPhoto: "\u0625\u0636\u0627\u0641\u0629 \u0635\u0648\u0631\u0629 \u0623\u0648 \u0641\u0627\u062A\u0648\u0631\u0629",
    cancel: "\u0625\u0644\u063A\u0627\u0621",
    addEntry: "\u0625\u0636\u0627\u0641\u0629",
    update: "\u062A\u062D\u062F\u064A\u062B",

    friendName: "\u0627\u0633\u0645 \u0627\u0644\u0635\u062F\u064A\u0642",
    friendNamePlaceholder: "\u0645\u062B\u0644\u0627 \u0623\u062D\u0645\u062F",
    language: "\u0627\u0644\u0644\u063A\u0629",
    save: "\u062D\u0641\u0638",

    attachedImage: "\u0635\u0648\u0631\u0629 \u0645\u0631\u0641\u0642\u0629",
    loading: "\u062C\u0627\u0631\u064A \u0627\u0644\u062A\u062D\u0645\u064A\u0644...",
    addEntryButton: "\u0625\u0636\u0627\u0641\u0629 \u0625\u062F\u062E\u0627\u0644",

    history: "\u0627\u0644\u0633\u062C\u0644",
    noHistory: "\u0644\u0627 \u064A\u0648\u062C\u062F \u0633\u062C\u0644",
    auditCreated: "\u062A\u0645 \u0627\u0644\u0625\u0646\u0634\u0627\u0621",
    auditUpdated: "\u062A\u0645 \u0627\u0644\u062A\u0639\u062F\u064A\u0644",
    auditDeleted: "\u062A\u0645 \u0627\u0644\u062D\u0630\u0641",
    auditRestored: "\u062A\u0645 \u0627\u0644\u0627\u0633\u062A\u0639\u0627\u062F\u0629",
    restore: "\u0627\u0633\u062A\u0639\u0627\u062F\u0629",

    export: "\u062A\u0635\u062F\u064A\u0631",
    exportEntries: (count: number) => `${count} \u0625\u062F\u062E\u0627\u0644 \u0641\u064A \u0627\u0644\u0646\u0637\u0627\u0642`,
  },
  darija: {
    appName: "LendLog",
    toggleTheme: "\u0628\u062F\u0644 \u0627\u0644\u0645\u0638\u0647\u0631",
    settings: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A",

    allSettled: "\u0643\u0644\u0634\u064A \u062A\u0635\u0641\u0651\u0627!",
    owesYou: (name: string) => `${name} \u062E\u0627\u0635\u0648 \u064A\u0631\u062F \u0644\u064A\u0643`,
    youOwe: (name: string) => `\u062E\u0627\u0635\u0643 \u062A\u0631\u062F \u0644 ${name}`,

    all: "\u0643\u0644\u0634\u064A",
    youLent: "\u0633\u0644\u0641\u062A",
    borrowed: "\u062A\u0633\u0644\u0641\u062A",
    allCurrencies: "\u0643\u0627\u0639 \u0627\u0644\u0639\u0645\u0644\u0627\u062A",
    currency: "\u0627\u0644\u0639\u0645\u0644\u0629",

    youLentAmount: "\u0633\u0644\u0641\u062A",
    youBorrowedAmount: "\u062A\u0633\u0644\u0641\u062A",
    to: (name: string) => ` \u0644 ${name}`,
    from: (name: string) => ` \u0645\u0646 ${name}`,
    at: "\u0641",

    noEntries: "\u0645\u0627 \u0643\u0627\u064A\u0646 \u062D\u062A\u0627 \u062D\u0627\u062C\u0629",
    noEntriesDesc: "\u0643\u0644\u064A\u0643\u064A \u0639\u0644\u0649 + \u0628\u0627\u0634 \u062A\u0632\u064A\u062F \u0623\u0648\u0644 \u0645\u0639\u0627\u0645\u0644\u0629",

    newEntry: "\u0625\u062F\u062E\u0627\u0644 \u062C\u062F\u064A\u062F",
    editEntry: "\u0628\u062F\u0644 \u0627\u0644\u0625\u062F\u062E\u0627\u0644",
    iLent: "\u0633\u0644\u0641\u062A",
    iBorrowed: "\u062A\u0633\u0644\u0641\u062A",
    amount: "\u0627\u0644\u0645\u0628\u0644\u063A",
    noteOptional: "\u0645\u0644\u0627\u062D\u0638\u0629 (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)",
    notePlaceholder: "\u0639\u0644\u0627\u0634 \u0643\u0627\u0646\u062A \u0647\u0627\u062F \u0627\u0644\u0641\u0644\u0648\u0633\u061F",
    attachmentOptional: "\u0645\u0631\u0641\u0642 (\u0627\u062E\u062A\u064A\u0627\u0631\u064A)",
    addPhoto: "\u0632\u064A\u062F \u062A\u0635\u0648\u064A\u0631\u0629 \u0648\u0644\u0627 \u0641\u0627\u0643\u062A\u0648\u0631\u0629",
    cancel: "\u0625\u0644\u063A\u0627\u0621",
    addEntry: "\u0632\u064A\u062F",
    update: "\u062D\u062F\u0651\u062B",

    friendName: "\u0633\u0645\u064A\u0629 \u0635\u0627\u062D\u0628\u0643",
    friendNamePlaceholder: "\u0645\u062B\u0644\u0627 \u0623\u062D\u0645\u062F",
    language: "\u0627\u0644\u0644\u063A\u0629",
    save: "\u062D\u0641\u0638",

    attachedImage: "\u062A\u0635\u0648\u064A\u0631\u0629 \u0645\u0631\u0641\u0642\u0629",
    loading: "\u0643\u064A\u062A\u062D\u0645\u0644...",
    addEntryButton: "\u0632\u064A\u062F \u0625\u062F\u062E\u0627\u0644",

    history: "\u0627\u0644\u062A\u0627\u0631\u064A\u062E",
    noHistory: "\u0645\u0627 \u0643\u0627\u064A\u0646 \u062A\u0627\u0631\u064A\u062E",
    auditCreated: "\u062A\u0632\u0627\u062F\u062A",
    auditUpdated: "\u062A\u0628\u062F\u0644\u062A",
    auditDeleted: "\u062A\u0645\u0633\u062D\u0627\u062A",
    auditRestored: "\u0631\u062C\u0639\u0627\u062A",
    restore: "\u0631\u062C\u0639",

    export: "\u062A\u0635\u062F\u064A\u0631",
    exportEntries: (count: number) => `${count} \u0625\u062F\u062E\u0627\u0644 \u0641 \u0627\u0644\u0645\u062F\u0629`,
  },
};

export type Translations = typeof translations.en;

export function getTranslations(locale: Locale): Translations {
  return translations[locale] as Translations;
}

export function getDateLocale(locale: Locale): string {
  switch (locale) {
    case "fr": return "fr-FR";
    case "ar": return "ar-MA";
    case "darija": return "ar-MA";
    default: return "en-US";
  }
}
