-- The Elf Chief may only run the show, e.g. a teacher who neither gives nor gets a gift.
alter table sessions add column if not exists host_plays boolean not null default true;
