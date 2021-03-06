const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/**
 * This class maintains the list of individual Story instances
 *  It also has some methods for fetching, adding, and removing stories
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /**
   * This method is designed to be called to generate a new StoryList.
   *  It:
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.*
   */

  // TODO: Note the presence of `static` keyword: this indicates that getStories
  // is **not** an instance method. Rather, it is a method that is called on the
  // class directly. Why doesn't it make sense for getStories to be an instance method?

  static async getStories() {
    // query the /stories endpoint (no auth required)
    const response = await axios.get(`${BASE_URL}/stories`);

    // turn the plain old story objects from the API into instances of the Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    const storyList = new StoryList(stories);
    return storyList;
  }

  /**
   * Method to make a POST request to /stories and add the new story to the list
   * - user - the current instance of User who will post the story
   * - newStory - a new story object for the API with title, author, and url
   *
   * Returns the new story object
   */

  static async addStory(user, newStory) {
    // this function should return the newly created story so it can be used in
    // the script.js file where it will be appended to the DOM
    let token = user.loginToken;

    const response = await axios.post(`${BASE_URL}/stories`, {
        token,
        story : newStory
      }, {
      headers: {
        accept: "application/json"
      }
    });

    let storyInstance = new Story(response.data.story);
    return storyInstance;
  }
}


/**
 * The User class to primarily represent the current user.
 *  There are helper methods to signup (create), login, and getLoggedInUser
 */

class User {
  constructor(userObj) {
    this.username = userObj.username;
    this.name = userObj.name;
    this.createdAt = userObj.createdAt;
    this.updatedAt = userObj.updatedAt;

    // these are all set to defaults, not passed in by the constructor
    this.loginToken = "";
    this.favorites = [];
    this.ownStories = [];

  }

  async addFavourite(storyId, userName, token) {
    // const favoriteStory = await axios.get(`${BASE_URL}/stories/${storyId}`);
    const response = await axios.post(`${BASE_URL}/users/${userName}/favorites/${storyId}`,
    { token });
    const favoriteList = response.data.user.favorites;
    const favoriteStory = favoriteList[favoriteList.length - 1];
    let storyInstance = new Story(favoriteStory);
    this.favorites.push(storyInstance);
  }

  async removeFavourite(storyId, userName, token) {

    await axios.delete(`${BASE_URL}/users/${userName}/favorites/${storyId}`, {
      data: {
        token,
      }
    });

    this.favorites = this.favorites.filter(element => {
      return element.storyId !== storyId;
    });
  }

  async removeOwnStory(storyId, token) {
    await axios.delete(`${BASE_URL}/stories/${storyId}`, {
      data: {
        token,
      }
    });

    this.ownStories = this.ownStories.filter(element => {
      return element.storyId !== storyId;
    });

    this.favorites = this.favorites.filter(element => {
      return element.storyId !== storyId;
    });
  }



  async addOwnStory(story, token) {
    let storyResponse = await axios.get(`${BASE_URL}/stories/${story.storyId}`);
    let storyObject = storyResponse.data.story;
    console.log(this.ownStories);
    this.ownStories.push(storyObject);
    console.log(this.ownStories);
    let response = await axios.patch(`${BASE_URL}/users/${this.username}`, {
        token,
        user: {
          stories: [
            {
              author: "",
              createdAt: "",
              storyId: "",
              title: "",
              updatedAt: "",
              url: "",
              username: ""
            }
          ],
        }
    })
    console.log(response);
  }

  /* Create and return a new user.
   *
   * Makes POST request to API and returns newly-created user.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async create(username, password, name) {
    const response = await axios.post(`${BASE_URL}/signup`, {
      user: {
        username,
        password,
        name
      }
    });

    // build a new User instance from the API response
    const newUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    newUser.loginToken = response.data.token;

    return newUser;
  }

  /* Login in user and return user instance.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios.post(`${BASE_URL}/login`, {
      user: {
        username,
        password
      }
    });

    // build a new User instance from the API response
    const existingUser = new User(response.data.user);

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = response.data.token;

    return existingUser;
  }

  /** Get user instance for the logged-in-user.
   *
   * This function uses the token & username to make an API request to get details
   *   about the user. Then it creates an instance of user with that info.
   */

  static async getLoggedInUser(token, username) {
    // if we don't have user info, return null
    if (!token || !username) return null;

    // call the API
    const response = await axios.get(`${BASE_URL}/users/${username}`, {
      params: {
        token
      }
    });

    // instantiate the user from the API information
    const existingUser = new User(response.data.user);

    // attach the token to the newUser instance for convenience
    existingUser.loginToken = token;

    // instantiate Story instances for the user's favorites and ownStories
    existingUser.favorites = response.data.user.favorites.map(s => new Story(s));
    existingUser.ownStories = response.data.user.stories.map(s => new Story(s));
    return existingUser;
  }
}

/**
 * Class to represent a single story.
 */

class Story {

  /**
   * The constructor is designed to take an object for better readability / flexibility
   * - storyObj: an object that has story properties in it
   */

  constructor(storyObj) {
    this.author = storyObj.author;
    this.title = storyObj.title;
    this.url = storyObj.url;
    this.username = storyObj.username;
    this.storyId = storyObj.storyId;
    this.createdAt = storyObj.createdAt;
    this.updatedAt = storyObj.updatedAt;
  }
}