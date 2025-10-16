exports.handler = async () => {
  const time = new Date().toISOString();
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Runtime ativo e funcionando.",
      serverTime: time
    })
  };
};
