"use strict";

const router = require("express").Router();
const path = require("path");
const _ = require("lodash");

const logger = require("../libs/logger").logger;
const mediaApi = require("../libs/mediaApi");
const constants = require("../utils/constants");

const MEDIA_PATH = path.join("/api", constants.CONTAINER_MEDIA_DIR);

/**
 * Serves media data for lecture
 */

/**
 *  Serves authenticated video via lv-proxy
 */
router.get("/:semester/:courseId/:lectureName/video", (req, res, next) => {
  const info = getLectureInfoOrReturn401(req, res);
  if (!info) return;
  logger.info(`Lecture: ${info.lectureName} video requested for ${info.courseId}:${info.course.name} requested by ${req.user.sub}`);
  const videoPath = path.join(MEDIA_PATH, info.semester, info.course.id, info.lectureName, "videoLarge.mp4");
  sendRedirectResponse(videoPath, "video/mp4", res);
});

/**
 *  Serves authenticated image metadata via lv-proxy
 */
router.get("/:semester/:courseId/:lectureName/images", (req, res, next) => {
  const info = getLectureInfoOrReturn401(req, res);
  if (!info) return;
  logger.info(`Lecture: ${info.lectureName} image meta data requested for ${info.courseId}:${info.course.name} requested by ${req.user.sub}`);
  mediaApi.getLectureData(info.semester, info.course.id, info.lectureName)
    .then(data => res.send(data))
    .catch(next);
});

/**
 *  Serves authenticated image via lv-proxy
 */
router.get("/:semester/:courseId/:lectureName/images/:imageSize(full|thumb)/:imageName", (req, res, next) => {
    const info = getLectureInfoOrReturn401(req, res);
    if (!info) return;
    const image = new ImageFile(req.params.imageName);
    const imageSize = req.params.imageSize === "full" ? "" : "-thumb";

    logger.info(`Lecture: ${info.lectureName} | Image: ${image.name}-${imageSize} requested for
              ${info.courseId}:${info.course.name}: requested by ${req.user.sub}`);

    const imageThumbPath = path.join(
      MEDIA_PATH, info.semester, info.course.id, info.lectureName, image.type, `${image.name}${imageSize}.png`);
    console.log(imageThumbPath);
    sendRedirectResponse(imageThumbPath, "image/png", res);
  }
);

class ImageFile {
  constructor(imageName) {
    this.name = imageName;

    const imageData = imageName.split("-");
    this.type = imageData[0];
    this.cameraNumber = Number(imageData[1]);
    this.timestamp = Number(imageData[2]);
    this.size = imageData.length > 3 ? "thumb" : "full";
  }
}


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
 * @return {Object | null} returns object wih lecture info if authorized user
 */
function getLectureInfoOrReturn401(req, res) {
  const userTypesCourses = req.user.userTypesCourses;
  const info = {
    semester: req.params.semester,
    courseId: req.params.courseId,
    lectureName: req.params.lectureName,
    course: _.flatMap(userTypesCourses).find(course => course.id === req.params.courseId)
  };
  // User not registered to course
  if (!info.course) {
    res.sendStatus(401);
    return null;
  }
  return info;
}

module.exports = router;
