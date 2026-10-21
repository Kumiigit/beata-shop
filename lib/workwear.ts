export const WORKWEAR_PRODUCTS = [
  { id: 'cap', image: '/workwear/work-cap.png', name: 'Work cap', namePl: 'Czapka robocza', description: 'A finishing touch for your team uniform.', descriptionPl: 'Dopełnienie firmowego stroju Twojego zespołu.', logoX: 50, logoY: 43, logoWidth: 28, logoHeight: 18 },
  { id: 'jacket', image: '/workwear/hivis-jacket.png', name: 'Hi-vis jacket', namePl: 'Kurtka odblaskowa', description: 'Make your business visible on the job.', descriptionPl: 'Zadbaj o widoczność swojej firmy w pracy.', logoX: 64, logoY: 31, logoWidth: 16, logoHeight: 11 },
  { id: 'polo', image: '/workwear/work-polo.png', name: 'Work polo shirt', namePl: 'Koszulka polo do pracy', description: 'A smart, coordinated look for your team.', descriptionPl: 'Spójny, profesjonalny wygląd Twojego zespołu.', logoX: 64, logoY: 34, logoWidth: 16, logoHeight: 11 },
  { id: 'vest', image: '/workwear/hivis-vest.png', name: 'Yellow hi-vis vest', namePl: 'Żółta kamizelka odblaskowa', description: 'A bright layer with space for your company logo.', descriptionPl: 'Wyrazista warstwa z miejscem na logo Twojej firmy.', logoX: 61, logoY: 35, logoWidth: 12, logoHeight: 9 },
  { id: 'gilet', image: '/workwear/work-gilet.png', name: 'Padded work gilet', namePl: 'Ocieplany bezrękawnik roboczy', description: 'An extra layer for your team’s workwear.', descriptionPl: 'Dodatkowa warstwa do stroju roboczego Twojego zespołu.', logoX: 62, logoY: 28, logoWidth: 16, logoHeight: 11 },
] as const;

export type WorkwearId = typeof WORKWEAR_PRODUCTS[number]['id'];
