// sort column/card
export const mapOrder = (originalArray, orderedArray, key) => {
  if (!originalArray || !orderedArray || !key) return [];
  return [...originalArray].sort(
    (a, b) => orderedArray.indexOf(a[key]) - orderedArray.indexOf(b[key])
  );
};
