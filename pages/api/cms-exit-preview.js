export default function handler(req, res) {
  res.clearPreviewData()
  res.redirect(307, "/")
}
