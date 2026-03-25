export const makeSnapshot = (value) => ({
  exists: () => value !== null && value !== undefined,
  val: () => value,
});

let autoId = 0;
export const nextKey = (prefix = "id") => {
  autoId += 1;
  return `${prefix}_${autoId}`;
};
