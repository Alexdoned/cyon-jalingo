import { denaryParishMap } from './denaryParishData';

export const getParishOptions = (denaryKey) => denaryParishMap[denaryKey] || [];

export default getParishOptions;
