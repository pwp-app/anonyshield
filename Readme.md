# AnonyShield

AnonyShield is a light-weight reverse proxy solution for ensuring only trusted visitors can visit the site, even if visitors have dynamic IP.

## Structure

AnonyShield maintains an IP whitelist to validate if the visitor is trusted.

![Structure](https://raw.githubusercontent.com/pwp-app/anonyshield/main/assets/structure.png)

This project includes a `client` to update IP for visitor whose IP is dynamic, a `reverse proxy server` to protect the site, and a `cli tool` to help you manage the whitelist.

Tip: All packages are powered by `Node.js`, please ensure that your environment has supported it.

## License

MIT
