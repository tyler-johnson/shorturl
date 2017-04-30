export default function(e, req, res, next) {
  if (!e) return next();

  let code = e.status || (e.cause && e.cause.status);
  const out = { error: true };

  if (typeof code === "number" && !isNaN(code) && code > 0) {
    if (e.message) out.message = e.message;
  } else {
    console.log(e.stack || e.toString());
    code = 500;
  }

  res.status(code);
  res.json(out);
}
