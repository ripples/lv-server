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
 * @param {Object} data - data for media object
 * @param {Object} res - response object
 */
function sendRedirectResponse(mediaPath, data, res) {
  res.writeHead(200, {
    "X-Accel-Redirect": mediaPath,
    "data": data
  });
  res.end();
}

/**
 *  Serves authenticated media data via lv-proxy
 */
router.get("/:semester/:courseId/:lectureName", (req, res, next) => {
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
  mediaApi.getLectureMediaData(semester, course.name, lectureName, (err, result) => {
    if (err) {
      next(err);
    }

    const data = {
      whiteboardImages: result.whiteboard,
      computerImages: result.computer
    };

    sendRedirectResponse(videoPath, data, res);
  });
});
