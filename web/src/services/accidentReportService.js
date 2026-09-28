const wait = (value) => new Promise((resolve) => setTimeout(() => resolve(value), 650))

export const accidentReportService = {
  async submit(report) {
    return wait({
      id: `DEMO-${Date.now().toString().slice(-8)}`,
      status: 'Reported',
      receivedAt: new Date().toISOString(),
      ...report
    })
  }
}