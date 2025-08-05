export declare type JsonProperyParser = (name: string, value: any) => any;

const isoDateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d*)?Z$/;

export const parseIsoDateStrToDate = (_: string, value: string | Date) => {
  if (typeof value === 'string' && isoDateFormat.test(value)) {
    return new Date(value);
  }
  return value;
};
