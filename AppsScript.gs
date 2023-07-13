function scrapeYouTubeChannel() {
  var channelId = "UCZTyFN1nQFaB_tYLcjC1-xw"; // YouTube channel ID
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = spreadsheet.getSheetByName("Youtube"); // Change "Youtube" to the name of your target sheet

  var apiKey = "YOUTUBE_API_KEY"; // Replace with your own YouTube Data API key
  var maxResults = 50; // Number of videos to fetch per request
  var pageToken = ""; // Token for pagination

  sheet.clearContents();
  sheet.appendRow(["Published", "Title", "Likes", "Views", "Comments", "Replies", "Description"]);

  var totalResults = 0;
  var fetchedResults = 0;

  do {
    var apiUrl = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=" + maxResults +
      "&channelId=" + channelId + "&key=" + apiKey + "&pageToken=" + pageToken;

    var response = UrlFetchApp.fetch(apiUrl);
    var json = response.getContentText();
    var data = JSON.parse(json);

    if (data.items && data.items.length > 0) {
      totalResults = data.pageInfo.totalResults;

      for (var i = 0; i < data.items.length; i++) {
        var videoItem = data.items[i];
        var videoId = getVideoId(videoItem);
        var videoTitle = videoItem.snippet.title;
        var videoLikes = "";
        var videoViews = "";
        var videoDescription = videoItem.snippet.description;
        var videoPublishedAt = new Date(videoItem.snippet.publishedAt).toLocaleDateString();

        if (videoId !== "") {
          try {
            Logger.log("Fetching statistics for video: " + videoId);
            videoLikes = getVideoLikes(videoId, apiKey);
            videoViews = getVideoViews(videoId, apiKey);
            var commentData = getCommentData(videoId, apiKey);
            var commentCount = commentData.commentCount;
            var replyCount = commentData.replyCount;
          } catch (error) {
            Logger.log("Error retrieving statistics for video: " + videoId);
            Logger.log("Error message: " + error);
          }

          // Generate the clickable link for the video
          var videoLink = "https://www.youtube.com/watch?v=" + videoId;
          var videoTitleWithLink = '=HYPERLINK("' + videoLink + '","' + videoTitle + '")';

          sheet.appendRow([
            videoPublishedAt,
            videoTitleWithLink,
            videoLikes,
            videoViews,
            commentCount,
            replyCount,
            videoDescription
          ]);

          fetchedResults++;
        } else {
          Logger.log("Video ID is undefined for video: " + videoTitle);
        }
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  Logger.log("Total videos: " + totalResults);
  Logger.log("Fetched videos: " + fetchedResults);
}


// The rest of the functions remain the same


function getVideoId(videoItem) {
  if (videoItem.id && videoItem.id.videoId) {
    return videoItem.id.videoId;
  }

  return "";
}

function getVideoLikes(videoId, apiKey) {
  var apiUrl = "https://www.googleapis.com/youtube/v3/videos?part=statistics&id=";
  var response = UrlFetchApp.fetch(apiUrl + videoId + "&key=" + apiKey);
  var json = response.getContentText();
  var data = JSON.parse(json);

  if (data.items && data.items.length > 0 && data.items[0].statistics && data.items[0].statistics.likeCount) {
    return data.items[0].statistics.likeCount;
  }

  return "";
}

function getVideoViews(videoId, apiKey) {
  var apiUrl = "https://www.googleapis.com/youtube/v3/videos?part=statistics&id=";
  var response = UrlFetchApp.fetch(apiUrl + videoId + "&key=" + apiKey);
  var json = response.getContentText();
  var data = JSON.parse(json);

  if (data.items && data.items.length > 0 && data.items[0].statistics && data.items[0].statistics.viewCount) {
    return data.items[0].statistics.viewCount;
  }

  return "";
}

function getCommentData(videoId, apiKey) {
  var apiUrl = "https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&order=relevance&type=video&videoId=";
  var response = UrlFetchApp.fetch(apiUrl + videoId + "&key=" + apiKey);
  var json = response.getContentText();
  var data = JSON.parse(json);

  var commentCount = data.pageInfo.totalResults;
  var replyCount = 0;

  return {
    commentCount: commentCount,
    replyCount: replyCount
  };
}
