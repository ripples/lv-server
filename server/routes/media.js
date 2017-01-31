"use strict";

const router = require("express").Router();
const path = require("path");

const logger = require("../libs/logger").logger;
const mediaApi = require("../libs/mediaApi");
const constants = require("../utils/constants");

const MEDIA_PATH = path.join("/api", constants.CONTAINER_MEDIA_DIR);

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
  res.setHeader("X-Accel-Redirect", mediaPath);
  res.setHeader("Content-Type", contentType);
  res.end();
}

/**
 * Extracts lecture info from request or throws 401 if user is unauthorized
 * @param {Object} req - Express Request object to extract lecture info
 * @param {Object} res - Express Response object to send 401 response if unauthorized
 * @return {Object} returns object wih lecture info if authorized user
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

  const videoPath = path.join(MEDIA_PATH, info.semester, info.course.id, info.lectureName, "videoLarge.mp4");
  sendRedirectResponse(videoPath, "video/mp4", res);
});

router.get("/:semester/:courseId/:lectureName/images", (req, res, next) => {
  const info = getLectureInfoOrReturn401(req, res);
  logger.info(
    `Lecture: ${info.lectureName} image meta data requested for
    ${info.courseId}:${info.course.name} requested by ${req.user.sub}`);

  mediaApi.getLectureData(info.semester, info.course.id, info.lectureName)
    .then(res.send)
    .catch(next);
});

router.get("/:semester/:courseId/:lectureName/images/:mediaType(whiteboard|computer)/:imageSize(full|thumb)/:mediaName",
  (req, res, next) => {
    const info = getLectureInfoOrReturn401(req, res);
    const mediaType = req.params.mediaType;
    const mediaName = req.params.mediaName;
    let imageSize = req.params.imageSize;

    logger.info(`Lecture: ${info.lectureName} ${mediaType} image requested for
              ${info.courseId}:${info.course.name}:${mediaName} requested by ${req.user.sub}`);

    switch (imageSize) {
      case "full": {
        imageSize = "";
        break;
      }
      case "thumb": {
        imageSize = "-thumb";
        break;
      }
      default: {
        throw new Error("Unknown image size request");
      }
    }

    const imageThumbPath = path.join(
      MEDIA_PATH, info.semester, info.course.id, info.lectureName, mediaType, `${mediaName}${imageSize}.png`);

    sendRedirectResponse(imageThumbPath, "image/png", res);
  });

module.exports = router;
