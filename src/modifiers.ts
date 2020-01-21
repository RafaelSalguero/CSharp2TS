import { optional, seq, any } from "./compose";
import { spaceOrLine } from "./regexs";

export const accessModifierRegex = optional(seq(any(/protected\s+internal/, /private\s+protected/, /public/, /private/, /protected/, /internal/), spaceOrLine));
