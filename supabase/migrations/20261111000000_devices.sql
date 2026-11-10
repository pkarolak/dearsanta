-- The Elf Chief's two devices: when the big screen first opened and when the host's phone took over the remote.
alter table sessions add column if not exists screen_seen_at timestamptz;
alter table sessions add column if not exists remote_paired_at timestamptz;
