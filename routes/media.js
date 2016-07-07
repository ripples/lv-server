"use strict";

const router = require("express").Router();
const path = require("path");

const logger = require("../lib/logger");
const mediaApi = require("../lib/mediaApi");

const MEDIA_PATH = path.join("/api", process.env.IMAGE_MEDIA_DIR);
const MEDIA_TYPES = ["whiteboard", "computer"];

/**
 * Serves media data for lecture
 */

/**
 * Sends response with included media path payload
 * @param {String} mediaPath - path of media source
 * @param {String} contentType - mimeType of response
 * @param {Object} res - response object
 */
function sendRedirectResponse(mediaPath, contentType, res) {
  console.log(mediaPath);
  res.setHeader("X-Accel-Redirect", mediaPath);
  res.setHeader("Content-Type", contentType);
  res.end();
}

/**
 * Extracts lecture info from request or throws 401 if user is unauthorized
 * @param req
 * @param res
 * @returns {{semester: (*|string|String), courseId: (*|String|string), lectureName: *, course: *}}
 */
function getLectureInfoOrReturn401(req, res) {
  const info = {
    semester: req.params.semester,
    courseId: req.params.courseId,
    lectureName: req.params.lectureName,
    course: req.user.courses.find(course => course.id === req.params.courseId)
  };
  // User not registered to course
  if (!info.course) {
    res.sendStatus(401);
  }
  return info;
}

/**
 *  Serves authenticated video data via lv-proxy
 */
router.get("/:semester/:courseId/:lectureName/video", (req, res, next) => {
  const info = getLectureInfoOrReturn401(req, res);
  logger.info(
    `Lecture: ${info.lectureName} video requested for
    ${info.courseId}:${info.course.name} requested by ${req.user.sub}`);

  const videoPath = path.join(MEDIA_PATH, info.semester, info.course.name, info.lectureName, "video.mp4");
  sendRedirectResponse(videoPath, "video/mp4", res);
});

router.get("/:semester/:courseId/:lectureName/images", (req, res, next) => {
  const info = getLectureInfoOrReturn401(req, res);

  logger.info(
    `Lecture: ${info.lectureName} image meta data requested for
    ${info.courseId}:${info.course.name} requested by ${req.user.sub}`);

  mediaApi.getLectureData(info.semester, info.course.name, info.lectureName, (err, result) => {
    if (err) {
      next(err);
    }

    res.send(result);
  });
});

// TODO: does user defined media type present a vulnerability? I don't think so, but be wary
router.get("/:semester/:courseId/:lectureName/images/:mediaType/:mediaName/thumb", (req, res, next) => {
  const info = getLectureInfoOrReturn401(req, res);
  const mediaType = req.params.mediaType;
  const mediaName = req.params.mediaName;

  logger.info(`Lecture: ${info.lectureName} ${mediaType} image requested for
              ${info.courseId}:${info.course.name}:${mediaName} requested by ${req.user.sub}`);

  const imageThumbPath = path.join(
    MEDIA_PATH, info.semester, info.course.name, info.lectureName, mediaType, `${mediaName}-thumb.jpeg`);

  sendRedirectResponse(imageThumbPath, "image/png", res);
});

// TODO: does user defined media type present a vulnerability? I don't think so, but be wary
router.get("/:semester/:courseId/:lectureName/images/:mediaType/:mediaName/full", (req, res, next) => {
  const info = getLectureInfoOrReturn401(req, res);
  const mediaType = req.params.mediaType;
  const mediaName = req.params.mediaName;

  // User is requesting something that doesn't exist, possibly malicious
  if (!MEDIA_TYPES.indexOf(mediaType) > -1) {
    res.sendStatus(401);
  }

  logger.info(
    `Lecture: ${info.lectureName} ${mediaType} image requested for
    ${info.courseId}:${info.course.name}:${mediaName} requested by ${req.user.sub}`);

  const imagePath = path.join(
    MEDIA_PATH, info.semester, info.course.name, info.lectureName, mediaType, `${mediaName}.jpeg`);
  sendRedirectResponse(imagePath, "image/png", res);
});

module.exports = router;
