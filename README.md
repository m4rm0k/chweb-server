<p align="center"><img src="https://rastating.github.com/assets/images/rasta-256.png" /></p>

<h1 align="center">chweb</h1>
<p align="center">
    <a href="https://travis-ci.org/rastating/chweb-server"><img src="https://travis-ci.org/rastating/chweb-server.svg?branch=master" /></a> <a href="https://codeclimate.com/github/rastating/chweb-server/maintainability"><img src="https://api.codeclimate.com/v1/badges/d354781ed3397172b890/maintainability" /></a> <a href="https://coveralls.io/github/rastating/chweb-server?branch=master"><img src="https://coveralls.io/repos/github/rastating/chweb-server/badge.svg?branch=master" /></a> <a href="https://www.patreon.com/rastating"><img src="https://img.shields.io/badge/patreon-support_this_project-orange" alt="Patreon" /></a>
</p>

<p align="center">
  A web browser access control system powered by Node.js and MongoDB
</p>

<hr>

Quick setup
-----------
The fastest way to start a chweb server is to use Docker. To setup the server with Docker:

1. Install Docker and Docker Compose on your system
2. Clone the source code: `git clone --recurse-submodules https://github.com/rastating/chweb-server.git`
3. Build the images and create the containers: `cd chweb-server && docker-compose up`
4. Create the initial admin user(s): `docker-compose exec app add-chweb-user`

After running `docker-compose`, the server will be running on port 8080. If you'd like to change this, you can alter the binding in `docker-compose.yml`

To start the service again after shutdown, open a terminal the chweb-server directory again, and run `docker-compose start` to start both the Mongo and chweb containers.

Manual installation
------------
1. Install and configure Node.js and MongoDB
2. Install [Yarn](https://yarnpkg.com/lang/en/): `npm -g install yarn`
3. Clone this repository and pull its modules: `git clone --recurse-submodules https://github.com/rastating/chweb-server.git`
4. Enter the chweb-server directory: `cd chweb-server`
5. Install the server dependencies and binaries: `yarn install && yarn link`
6. Install the web app dependencies: `yarn --cwd public/app install`
7. Build the web app: `yarn --cwd public/app build`
8. Run the setup wizard: `chweb-setup`
9. Add your first admin user by running the wizard: `add-chweb-user`
10. Start the server: `chweb-httpd`

How does chweb work?
--------------------
Chweb consists of three core components:

- A MongoDB database to store the backend settings and access rules
- The chweb server
- The chweb browser extension

When the web browser is loaded, the chweb browser extension will pull down the latest access rules from the chweb server specified in the extension settings and then detect all root level requests made by the user and determine whether or not to allow the request to be made.

For example, let's say the access rules have a default action to reject all requests, but there is an `allow` rule setup for `www.youtube.com`. If a user tries to visit YouTube, it will detect the request to https://www.youtube.com/ and allow it. Once YouTube loads, it will make requests to multiple CDNs (for example's sake, let's use some fictitious hosts, `cdn1.youtube.com` and `cdn2.youtube.com`). If the user were to enter these URLs in their address bar themselves, they would be denied, as only `www.youtube.com` is setup to be allowed, but if requests are made to these domains as a result of visiting `www.youtube.com`, then they will be allowed.

If requests are handled in an extension, can't this be easily bypassed by a user?
---------------------------------------------------------------------------------
Yes - chweb is not intended to be used in scenarios in which the user is not opting in to having their access control managed for them. It is instead designed with people in mind who want to use the web, but aren't able to reliably identify phishing sites and scams. For example, if you are providing care for someone with a memory disorder, such as dementia, they may be able to still use a computer but not have enough retention to stay vigilant when encountering phishing websites - in this scenario, chweb can help in keeping them safe online.

Which web browsers are supported?
---------------------------------
Currently, only Google Chrome is supported. However, I hope to create builds of the extension for other browsers soon.

The extension is currently awaiting approving to be added to the Google store (where it will be free). Until then, it must be loaded from source from [This Repository](https://github.com/rastating/chweb-chrome)

Setting up a browser
--------------------
To setup a browser, create a new host in the chweb admin panel and make note of the API key. After doing this, open the options of the browser extension (click the chweb icon and click `Options`) and add the address of the chweb server (e.g. `http://127.0.0.1:8080`) and  the API key that you generated for that client.
