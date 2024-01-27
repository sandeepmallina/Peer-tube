const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res)).catch((err) => next(err));
  };
};

// const asyncHandler = ( )
// const asyncHandter = (func) => ( )
// const asyncHandler = (func) async ( )

// const asyncHandler = (fun) => async (req, res, next) => {
//   try {
//     await fun(req, res, next);
//   } catch (err) {
//     res.status(err.code || 500).json({
//       success: false,
//       message: err.message,
//     });
//   }
// };

export default asyncHandler;
