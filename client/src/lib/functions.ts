export const pseudoId = () => {
  return (
    "id_" +
    Math.random()
      .toString(36)
      .replace(/[^a-z]+/g, "")
      .slice(0, 5) +
    "_" +
    Math.round(Math.random() * 1000)
  );
};
