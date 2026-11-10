-- A short numeric code to open the big screen on a TV or laptop that cannot scan QR codes.
alter table sessions add column screen_code text;
update sessions set screen_code = lpad((floor(random() * 1000000))::int::text, 6, '0') where screen_code is null;
alter table sessions alter column screen_code set not null;
create unique index sessions_screen_code_key on sessions (screen_code);
