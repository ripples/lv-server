# lv-server
Backend logic for Lecture Viewer.

All installation is done automatically through docker. If you do not have docker installed, install [here](https://docs.docker.com/engine/installation/).

### To Run using Docker Compose (Recommended)
The easiest way to run for production is to use the docker-compose file that can be found [here](https://github.com/stanleyrya/lecture-viewer). It is possible however to run the container manually. The following instructions can be used to deploy manually for both production and development environments.

### Setup
This service uses environment variables to make it easier to deploy at different locations. You will need to create a file named ```lecture-viewer.env``` one level above this directory for deployment to work properly. The following environment variables are used in this service:

- ```SIGNING_KEY``` - The key used to sign authentication tokens.

Below is an example of what your ```lecture-viewer.env``` should look like using the above environment variables. ```YOUR_VALUE_HERE``` is simply a placeholder for your own value.
```
SIGNING_KEY=YOUR_VALUE_HERE
```

To make sure everything works correctly, make sure you use the same values for each service you are using. This can be easily done by using the same ```lecture-viewer.env``` file.

### To Run Manually (Production)
From inside docker virtual machine, navigate to the top directory of this repository. Enter the following commands:
```
docker build -t lv-server .
docker run -d --name lv-server -p 3000:3000 --env-file ../lecture-viewer.env -v /media:/media lv-server
# where the left /media is a directory on your file system that lecture media is stored in
```

This will run your container 'detached'. Here are some useful commands to interact with a detached container:
```
# kill a container
docker kill lv-server

# view output
docker logs -f lv-server

# restart a container
docker restart -t=0 lv-server
```

### To Run Manually (Development)
The easiest way to develop using the docker container is to mount your working directory as a volume. From inside docker virtual machine, navigate to the top directory of this repository. Enter the following commands:
```
docker build -t lv-server .
docker run --rm -i -t -p 3000:3000 --env-file ../lecture-viewer.env -v /media:/media -v $PWD:/src lv-server /bin/sh
# where the left /media is a directory on your file system that lecture media is stored in
# where $PWD is a variable to your current directory and may need changing if you are using a windows environment
```

This will run your container 'attached' and leave you in your source directory. All changes you make on your host machine (in this directory) will be present in your container. Run ```npm install``` and ```npm start``` in your container to test, just as if you were only using your host machine. To kill the container from inside the container, type in ```exit```.
