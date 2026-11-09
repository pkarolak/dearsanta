-- Spontaneous sessions: people join with just a name, and the door opens by itself.
alter table session_participants alter column email drop not null;
alter table sessions add column auto_admit boolean not null default false;
