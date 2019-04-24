

 (async function load(){
  async function getData(url){
    const response = await fetch(url)
    const data = await response.json()
    if (data.data && data.data.movie_count){
      return data
    }else if(data.results){
      return data
    }
    throw new Error('No se encontró ningun resultado');
  }


  const $form = document.getElementById('form');
  const $home = document.getElementById('home');
  const $featuringContainer = document.getElementById('featuring');
 

  function setAttributes($element,attributes){
    for (const attribute in attributes){
      $element.setAttribute(attribute, attributes[attribute]);
    }
  }

   const BASE_API = 'https://yts.am/api/v2/';
  
   function featuringTemplate(peli){
     return(
       `
       <div class="featuring">
        <div class="featuring-image">
          <img src="${peli.medium_cover_image}" width="70" height="100" alt="">
        </div>
        <div class="featuring-content">
          <p class="featuring-title">Pelicula encontrada</p>
          <p class="featuring-album">${peli.title}</p>
        </div>
      </div>
      `
     )
   }
   function userTemplate(user) {
     return (
       `
        <li class="playlistFriends-item" data-uuid=${user.login.uuid}>
          <a href="#">
            <img src=${user.picture.thumbnail} alt="User Picture" />
            <span>
              ${user.login.username}
            </span>
          </a>
        </li>
       `
     )
   }
  
  $form.addEventListener('submit', async (event) => {
    event.preventDefault();
    $home.classList.add('search-active');
    const $loader=document.createElement('img');
    setAttributes($loader,{
      src: 'src/images/loader.gif',
      height:50,
      width:50,
    })
    $featuringContainer.append($loader);

    const data = new FormData($form);
    try {
      const {
        //key
        data: {
          movies: pelis
        }
      } = await getData(`${BASE_API}list_movies.json?limit=1&query_term=${data.get('name')}`);
      const HTMLString = featuringTemplate(pelis[0]);

      $featuringContainer.innerHTML = HTMLString;
    }
    catch (error) {
      alert(error.message);
      $loader.remove();
      $home.classList.remove('search-active');
    }
    
  })
   
  function videoItemTemplate(movie, category) {
     return (`
     <div class="primaryPlaylistItem" data-id="${movie.id}" data-category="${category}">
     <div class="primaryPlaylistItem-image" >
       <img src="${movie.medium_cover_image}">
      </div>
       <h4 class="primaryPlaylistItem-title">
         ${movie.title}
        </h4>
    </div>`
     )
  }
  
   function userDescriptionTemplate(user) {
     return (
       `
       <ul class="userDescriptionTemplate">
        <li id='userModalName'><span class="userModalField">Name</span> : <span>${user.name.first} ${user.name.last}</span></li>
        <li id='userModalAge'><span class="userModalField">Age</span> : <span>${user.dob.age}</span></li>
        <li id='userModalGender'><span class="userModalField">Genre</span> : <span>${user.gender}</span></li>
        <li id='userModalEmail'><span class="userModalField">E-mail</span> : <span>${user.email}</span></li>
        <li id='userModalCity'><span class="userModalField">Location</span> : <span>${user.location.city}</span></li>
       `
     )
   }

  function createTemplate(HTMLString){
    //se crea un documento html vacío
    const html = document.implementation.createHTMLDocument();
    //se agrega la plantilla al innerHTML del documento html 
    //esto hace que la plantilla en texto se convierta a elementos DOM
    html.body.innerHTML = HTMLString;

    return html.body.children[0];
  }

  function addEventClick($element){
    $element.addEventListener('click', () => {
      showModal($element)
    })
  }

  function renderMovieList(list, $container, category){
    //borra el img de carga
    $container.children[0].remove();
    list.forEach((movie) => {
      // debugger
      //se trae la plantilla y se guarda en una variable.
      const HTMLString = videoItemTemplate(movie, category);
      const movieElement = createTemplate(HTMLString);
      //se agrega el primer hijo (que es donde se encuentra la plantilla) al contenedor donde se quiere agregar la plantilla
      $container.append(movieElement);
      const image = movieElement.querySelector('img');
      image.addEventListener('load', (event) => {
        event.srcElement.classList.add('fadeIn');
      }
      )
      addEventClick(movieElement);
    })
  }

   function renderUserList(list, $container) {
     list.forEach((user) => {
       // debugger
       //se trae la plantilla y se guarda en una variable.
       const HTMLString = userTemplate(user);
       const userElement = createTemplate(HTMLString);
       //se agrega el primer hijo (que es donde se encuentra la plantilla) al contenedor donde se quiere agregar la plantilla
       $container.append(userElement);
       const image = userElement.querySelector('img');
       image.addEventListener('load', (event) => {
         event.srcElement.classList.add('fadeIn');
       }
       )
       addEventClick(userElement);
     })
   }


   async function cacheExist(category) {
     const listName = `${category}List`;
     const cacheList = window.localStorage.getItem(listName);

     if (cacheList) {
       return JSON.parse(cacheList);
     }
     const { data: { movies: data } } = await getData(`${BASE_API}list_movies.json?genre=${category}`)
     window.localStorage.setItem(listName, JSON.stringify(data))

     return data;
   }
   const $actionContainer = document.querySelector('#action');
   const $dramaContainer = document.getElementById('drama');
   const $animationContainer = document.getElementById('animation');



   async function updateData(category, container) {
     const list = await cacheExist(category);
     renderMovieList(list, container, category);
     return list;
   }

   const $links = document.getElementsByClassName('link');
   let [actionList, dramaList, animationList] = await Promise.all([
     updateData('action', $actionContainer),
     updateData('drama', $dramaContainer),
     updateData('animation', $animationContainer)
   ]);

   [].forEach.call($links, element => {
     element.addEventListener('click', event => {
       const updateTerm = event.target.dataset.update;
       localStorage.removeItem(`${updateTerm}List`)
       location.reload()
     })
   })

  
  const { results: users } = await getData(`https://randomuser.me/api/?results=20`);
  const $userContainer = document.getElementById('sidebarPlaylist');
  renderUserList(users, $userContainer)

  // const { data: { movies: actionList } } = await getData(`${BASE_API}list_movies.json?genre=action`);

  
  renderMovieList(actionList, $actionContainer, 'action')
  renderMovieList(dramaList, $dramaContainer, 'drama')
  renderMovieList(animationList, $animationContainer, 'animation')
  
  const $modal = document.getElementById('modal');
  const $overlay = document.getElementById('overlay');
  const $hideModal = document.getElementById('hide-modal');

  //Selectores Modal
  const $modalTitle = $modal.querySelector('h1');
  const $modalImage = $modal.querySelector('img');
  const $modalDescription = $modal.querySelector('p');

  function findById(list, id){
    return list.find(movie => movie.id === parseInt(id, 10))
  }

  function findMovie(id, category){
    switch (category) {
      case 'action' : {
        return findById(actionList, id)
      }
      case 'drama' : {
        return findById(dramaList, id)
      }
      default: {
        return findById(animationList, id)
      }
    }
  }
  function findUserByUuid(list, uuid) {
     return list.find( user => user.login.uuid === uuid )
   }

  function showModal($element){
    $overlay.classList.add('active');
    $modal.style.animation= 'modalIn .8s forwards';
    const id= $element.dataset.id;
    const uuid= $element.dataset.uuid;
    const category = $element.dataset.category;
    try{
      const data = findMovie(id, category);

      $modalTitle.textContent = data.title;
      $modalImage.setAttribute('src', data.medium_cover_image);
      $modalDescription.textContent = data.description_full;
      
    }catch(error){
      const data = findUserByUuid(users, uuid);

      $modalTitle.textContent = data.login.username;
      $modalImage.setAttribute('src', data.picture.large);
      const HTMLString = userDescriptionTemplate(data);
      const descriptionElement = createTemplate(HTMLString);
      $modalDescription.append(descriptionElement);
    }
   }

  $hideModal.addEventListener('click',hideModal);

  function hideModal(){
    $overlay.classList.remove('active');
    $modal.style.animation = 'modalOut .8s forwards';
    setTimeout(()=> $modalDescription.textContent = '',800)
  }
  //jQuery
  // const $home = $('.home .list #item');

  // console.log(videoItemTemplatle('src/images/covers.bitcoin.jpg','bitcoin'));

  })()