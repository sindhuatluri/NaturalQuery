type InputObject = Record<string, string>;
type OutputObject = { value: number; segment: string };

export function transformPieChartArray(objects: InputObject[]): OutputObject[] {
  if (!Array.isArray(objects)) {
    throw new Error('Input is not an array.');
  }

  return objects.map((obj) => {
    let value: number | undefined;
    let segment: string | undefined;

    for (const [_, val] of Object.entries(obj)) {
      const numValue = Number(val);

      if (value === undefined && !isNaN(numValue)) {
        value = numValue;
      } else if (segment === undefined) {
        segment = val;
      }

      if (value !== undefined && segment !== undefined) {
        break;
      }
    }

    if (value === undefined || segment === undefined) {
      throw new Error('Object does not contain a valid numeric entry and a segment.');
    }

    return { value, segment };
  });
}
