# copy .env.example to .env if not exist
if [ ! -f .env ]; then
  cp .env.example .env
fi
