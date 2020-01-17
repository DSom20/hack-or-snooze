$(async function () {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  const $favouriteArticles = $("#favorited-articles");
  const favStar = "fas fa-star star";
  const unfavStar = "far fa-star star";

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    const username = $("#login-username").val();
    const password = $("#login-password").val();

    // call the login static method to build a user instance
    const userInstance = await User.login(username, password);
    // set the global user to the user instance
    currentUser = userInstance;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  $createAccountForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    let name = $("#create-account-name").val();
    let username = $("#create-account-username").val();
    let password = $("#create-account-password").val();

    // call the create method, which calls the API and then builds a new user instance
    const newUser = await User.create(username, password, name);
    currentUser = newUser;
    syncCurrentUserToLocalStorage();
    loginAndSubmitForm();
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", function () {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function () {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function () {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  //Event handler for Navigation to Favorites
  $("body").on("click", "#favorites", async function() {
    hideElements();
    generateFavs();
    $favouriteArticles.show();
  })

  $("#navbar").on("click", "#submit", function () {
    $submitForm.hide();
    $submitForm.slideDown();
  })

  $submitForm.on("submit", async function (e) {
    e.preventDefault();
    let story = {
      author: $("#author").val(),
      title: $("#title").val(),
      url: $("#url").val()
    };

    if (currentUser) {
      let storyInstance = await StoryList.addStory(currentUser, story);
      const result = generateStoryHTML(storyInstance);
      $allStoriesList.prepend(result);
    }

    $submitForm.slideToggle();
    $("#author").val("");
    $("#title").val("");
    $("#url").val("");
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    await generateStories();

    if (currentUser) {
      showNavForLoggedInUser();
    }
  }

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar
    showNavForLoggedInUser();
  }

  //making our fav stars working

  $("body").on("click", ".star", async function(event) {
    console.log("current-user", currentUser.favorites);
    let $target = $(event.target);
    let storyId = $target.parent().attr("id")
    if (currentUser) {
      $target.toggleClass(favStar);
      $target.toggleClass(unfavStar);
      if ($target.hasClass(favStar)) {
        await currentUser.addFavourite(storyId, currentUser.username, currentUser.loginToken);
      } else {
        console.log("toggle success");
       currentUser.removeFavourite(storyId, currentUser.username, currentUser.loginToken);
      }
    }

  });



  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  function generateFavs() {

    const arrayOfFav = currentUser.favorites;
    // empty out that part of the page
    $favouriteArticles.empty();

    // loop through all of our favorites and generate HTML for them
    for (let story of arrayOfFav) {
      const result = generateStoryHTML(story);
      $favouriteArticles.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);
    let favOrNot = "far"
    for (let i = 0; i < currentUser.favorites.length; i++) {
      let objOfStories = currentUser.favorites[i];
      if (objOfStories.storyId === story.storyId) {
        favOrNot = "fas";
        break;
      }
    }
    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <i class="${favOrNot} fa-star star"></i><a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong></a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm
    ];
    elementsArr.forEach($elem => $elem.hide());
  }

  function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
