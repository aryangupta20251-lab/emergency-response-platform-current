const wait = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 350))

export const adminManagementService = {
  update(record) { return wait(record) },
  remove(record) { return wait(record) }
}