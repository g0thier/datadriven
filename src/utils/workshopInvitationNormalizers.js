export const getId = (obj, fallbackIndex) =>
  obj?.id ?? obj?._id ?? obj?.slug ?? obj?.code ?? String(fallbackIndex);

export const getDeptLabel = (department) =>
  department?.name ??
  department?.label ??
  department?.title ??
  department?.department ??
  "Département";

export const getMemberLabel = (member) => {
  const fullName =
    member?.fullName ??
    member?.name ??
    [member?.firstName, member?.lastName].filter(Boolean).join(" ") ??
    member?.title ??
    "Membre";

  const email = member?.email ?? member?.mail ?? "";
  return email ? `${fullName} — ${email}` : fullName;
};

export const normalizeDepartments = (items = []) =>
  items.map((department, index) => ({
    ...department,
    __id: getId(department, index),
    __label: getDeptLabel(department),
  }));

export const normalizeMembers = (items = []) =>
  items.map((member, index) => ({
    ...member,
    __id: getId(member, index),
    __label: getMemberLabel(member),
  }));

export const toggleInArray = (items, id) =>
  items.includes(id) ? items.filter((item) => item !== id) : [...items, id];
