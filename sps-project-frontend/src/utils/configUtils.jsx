export const config = {
    onUploadProgress: progressEvent => {
      let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);
      alert(percentCompleted)
      // do whatever you like with the percentage complete
      // maybe dispatch an action that will update a progress bar or something
    }
  }