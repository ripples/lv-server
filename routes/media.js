"use strict";

const router = require("express").Router();
const path = require("path");

const logger = require("../lib/logger");
const mediaApi = require("../lib/mediaApi");

const MEDIA_PATH = ["/api", process.env.MEDIA_DIR];

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
 *  Serves authenticated video data via lv-proxy
 */
router.get("/:semester/:courseId/:lectureName/video", (req, res, next) => {
  const semester = req.params.semester;
  const courseId = req.params.courseId;
  const lectureName = req.params.lectureName;
  const course = req.user.courses.find(course => course.id === courseId);

  // User not registered to course
  if (!course) {
    res.sendStatus(401);
  }
  logger.info(`Lecture: ${lectureName} video requested for ${courseId}:${course.name} requested by ${req.user.sub}`);

  const videoPath = path.join(...MEDIA_PATH, semester, course.name, lectureName, "video.mp4");
  sendRedirectResponse(videoPath, "video/mp4", res);
});

router.get("/:semester/:courseId/:lectureName/images", (req, res, next) => {
  const semester = req.params.semester;
  const courseId = req.params.courseId;
  const lectureName = req.params.lectureName;
  const course = req.user.courses.find(course => course.id === courseId);

  mediaApi.getLectureData(semester, course.name, lectureName, (err, result) => {
    if (err) {
      next(err);
    }

    res.send(result);
  });
});

module.exports = router;
