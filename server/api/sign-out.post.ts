export default defineEventHandler(async (event) => {
  const session = await viewerSession(event);
  await session.clear();
  return { viewer: null };
});
