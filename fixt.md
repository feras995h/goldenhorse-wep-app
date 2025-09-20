ERROR: failed to build: failed to solve: process "/bin/bash -ol pipefail -c cd server && npm run ensure-main-accounts" did not complete successfully: exit code: 1
2025-Sep-19 14:22:18.163967
exit status 1
2025-Sep-19 14:22:18.232779
Oops something is not okay, are you okay? 😢
2025-Sep-19 14:22:18.240197
#0 building with "default" instance using docker driver
2025-Sep-19 14:22:18.240197
2025-Sep-19 14:22:18.240197
#1 [internal] load build definition from Dockerfile
2025-Sep-19 14:22:18.240197
#1 transferring dockerfile: 1.83kB 0.0s done
2025-Sep-19 14:22:18.240197
#1 DONE 0.0s
2025-Sep-19 14:22:18.240197
2025-Sep-19 14:22:18.240197
#2 [internal] load metadata for ghcr.io/railwayapp/nixpacks:ubuntu-1745885067
2025-Sep-19 14:22:18.240197
#2 DONE 1.1s
2025-Sep-19 14:22:18.240197
2025-Sep-19 14:22:18.240197
#3 [internal] load .dockerignore
2025-Sep-19 14:22:18.240197
#3 transferring context: 1.49kB done
2025-Sep-19 14:22:18.240197
#3 DONE 0.0s
2025-Sep-19 14:22:18.240197
2025-Sep-19 14:22:18.240197
#4 [stage-0  1/13] FROM ghcr.io/railwayapp/nixpacks:ubuntu-1745885067@sha256:d45c89d80e13d7ad0fd555b5130f22a866d9dd10e861f589932303ef2314c7de
2025-Sep-19 14:22:18.240197
#4 resolve ghcr.io/railwayapp/nixpacks:ubuntu-1745885067@sha256:d45c89d80e13d7ad0fd555b5130f22a866d9dd10e861f589932303ef2314c7de done
2025-Sep-19 14:22:18.240197
#4 sha256:75908e6a244aa7c07bd16c59f1a88c832d0735edf545bd28f86d6bee4a5536a0 4.43kB / 4.43kB done
2025-Sep-19 14:22:18.240197
#4 sha256:d45c89d80e13d7ad0fd555b5130f22a866d9dd10e861f589932303ef2314c7de 1.61kB / 1.61kB done
2025-Sep-19 14:22:18.240197
#4 sha256:98801a2e9c74b1236de01aa97bc99349f700f53f81d3bbab4411e2a8a9dd316d 1.06kB / 1.06kB done
2025-Sep-19 14:22:18.240197
#4 DONE 0.1s
2025-Sep-19 14:22:18.240197
2025-Sep-19 14:22:18.240197
#5 [internal] load build context
2025-Sep-19 14:22:18.240197
#5 transferring context: 5.36MB 0.3s done
2025-Sep-19 14:22:18.240197
#5 DONE 0.3s
2025-Sep-19 14:22:18.240197
2025-Sep-19 14:22:18.240197
#6 [stage-0  2/13] WORKDIR /app/
2025-Sep-19 14:22:18.240197
#6 DONE 0.1s
2025-Sep-19 14:22:18.240197
2025-Sep-19 14:22:18.240197
#7 [stage-0  3/13] COPY .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix
2025-Sep-19 14:22:18.240197
#7 DONE 0.0s
2025-Sep-19 14:22:18.240197
2025-Sep-19 14:22:18.240197
#8 [stage-0  4/13] RUN nix-env -if .nixpacks/nixpkgs-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.nix && nix-collect-garbage -d
2025-Sep-19 14:22:18.240197
#8 0.455 unpacking 'https://github.com/NixOS/nixpkgs/archive/ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7.tar.gz' into the Git cache...
2025-Sep-19 14:22:18.240197
#8 54.00 unpacking 'https://github.com/railwayapp/nix-npm-overlay/archive/main.tar.gz' into the Git cache...
2025-Sep-19 14:22:18.240197
#8 54.80 installing 'ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env'
2025-Sep-19 14:22:18.240197
#8 55.83 these 5 derivations will be built:
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/6vy68gykpxfphbmmyd59ya88xvrwvvaa-npm-9.9.4.tgz.drv
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/cjdjkmr6gy2h8l0cra71whgrvy030kx1-libraries.drv
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/bs6g8vhkfynvlzidhlqbsvnc9wijbaaz-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/w9h0z1lhfwxc0m38f3w5brfdqrzm4wyj-npm.drv
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/9jwhwnx07rlarp2ancqq1cnwz1z7kzg0-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv
2025-Sep-19 14:22:18.240197
#8 55.83 these 75 paths will be fetched (116.25 MiB download, 554.76 MiB unpacked):
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/cf7gkacyxmm66lwl5nj6j6yykbrg4q5c-acl-2.3.2
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/a9jgnlhkjkxav6qrc3rzg2q84pkl2wvr-attr-2.5.2
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/5mh7kaj2fyv8mk4sfq1brwxgc02884wi-bash-5.2p37
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/j7p46r8v9gcpbxx89pbqlh61zhd33gzv-binutils-2.43.1
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/df2a8k58k00f2dh2x930dg6xs6g6mliv-binutils-2.43.1-lib
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/srcmmqi8kxjfygd0hyy42c8hv6cws83b-binutils-wrapper-2.43.1
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/wf5zj2gbib3gjqllkabxaw4dh0gzcla3-builder.pl
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/ivl2v8rgg7qh1jkj5pwpqycax3rc2hnl-bzip2-1.0.8
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/mglixp03lsp0w986svwdvm7vcy17rdax-bzip2-1.0.8-bin
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/4s9rah4cwaxflicsk5cndnknqlk9n4p3-coreutils-9.5
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/pkc7mb4a4qvyz73srkqh4mwl70w98dsv-curl-8.11.0
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/p123cq20klajcl9hj8jnkjip5nw6awhz-curl-8.11.0-bin
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/5f5linrxzhhb3mrclkwdpm9bd8ygldna-curl-8.11.0-dev
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/agvks3qmzja0yj54szi3vja6vx3cwkkw-curl-8.11.0-man
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/00g69vw7c9lycy63h45ximy0wmzqx5y6-diffutils-3.10
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/74h4z8k82pmp24xryflv4lxkz8jlpqqd-ed-1.20.2
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/qbry6090vlr9ar33kdmmbq2p5apzbga8-expand-response-params
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/c4rj90r2m89rxs64hmm857mipwjhig5d-file-5.46
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/jqrz1vq5nz4lnv9pqzydj0ir58wbjfy1-findutils-4.10.0
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/a3c47r5z1q2c4rz0kvq8hlilkhx2s718-gawk-5.3.1
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/l89iqc7am6i60y8vk507zwrzxf0wcd3v-gcc-14-20241116
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/bpq1s72cw9qb2fs8mnmlw6hn2c7iy0ss-gcc-14-20241116-lib
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/17v0ywnr3akp85pvdi56gwl99ljv95kx-gcc-14-20241116-libgcc
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/xcn9p4xxfbvlkpah7pwchpav4ab9d135-gcc-wrapper-14-20241116
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/65h17wjrrlsj2rj540igylrx7fqcd6vq-glibc-2.40-36
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/1c6bmxrrhm8bd26ai2rjqld2yyjrxhds-glibc-2.40-36-bin
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/kj8hbqx4ds9qm9mq7hyikxyfwwg13kzj-glibc-2.40-36-dev
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/kryrg7ds05iwcmy81amavk8w13y4lxbs-gmp-6.3.0
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/a2byxfv4lc8f2g5xfzw8cz5q8k05wi29-gmp-with-cxx-6.3.0
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/1m67ipsk39xvhyqrxnzv2m2p48pil8kl-gnu-config-2024-01-01
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/aap6cq56amx4mzbyxp2wpgsf1kqjcr1f-gnugrep-3.11
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/fp6cjl1zcmm6mawsnrb5yak1wkz2ma8l-gnumake-4.4.1
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/abm77lnrkrkb58z6xp1qwjcr1xgkcfwm-gnused-4.9
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/9cwwj1c9csmc85l2cqzs3h9hbf1vwl6c-gnutar-1.35
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/nvvj6sk0k6px48436drlblf4gafgbvzr-gzip-1.13
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/wwipgdqb4p2fr46kmw9c5wlk799kbl68-icu4c-74.2
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/m8w3mf0i4862q22bxad0wspkgdy4jnkk-icu4c-74.2-dev
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/xmbv8s4p4i4dbxgkgdrdfb0ym25wh6gk-isl-0.20
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/2wh1gqyzf5xsvxpdz2k0bxiz583wwq29-keyutils-1.6.3-lib
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/milph81dilrh96isyivh5n50agpx39k2-krb5-1.21.3
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/b56mswksrql15knpb1bnhv3ysif340kd-krb5-1.21.3-dev
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/v9c1s50x7magpiqgycxxkn36avzbcg0g-krb5-1.21.3-lib
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/34z2792zyd4ayl5186vx0s98ckdaccz9-libidn2-2.3.7
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/2a3anh8vl3fcgk0fvaravlimrqawawza-libmpc-1.3.1
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/8675pnfr4fqnwv4pzjl67hdwls4q13aa-libssh2-1.11.1
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/d7zhcrcc7q3yfbm3qkqpgc3daq82spwi-libssh2-1.11.1-dev
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/xcqcgqazykf6s7fsn08k0blnh0wisdcl-libunistring-1.3
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/r9ac2hwnmb0nxwsrvr6gi9wsqf2whfqj-libuv-1.49.2
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/ll14czvpxglf6nnwmmrmygplm830fvlv-libuv-1.49.2-dev
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/6cr0spsvymmrp1hj5n0kbaxw55w1lqyp-libxcrypt-4.4.36
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/pc74azbkr19rkd5bjalq2xwx86cj3cga-linux-headers-6.12
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/fv7gpnvg922frkh81w5hkdhpz0nw3iiz-mirrors-list
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/qs22aazzrdd4dnjf9vffl0n31hvls43h-mpfr-4.2.1
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/grixvx878884hy8x3xs0c0s1i00j632k-nghttp2-1.64.0
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/dz97fw51rm5bl9kz1vg0haj1j1a7r1mr-nghttp2-1.64.0-dev
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/qcghigzrz56vczwlzg9c02vbs6zr9jkz-nghttp2-1.64.0-lib
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/wlpq101dsifq98z2bk300x4dk80wcybr-nodejs-18.20.5
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/9l9n7a0v4aibcz0sgd0crs209an9p7dz-openssl-3.3.2
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/h1ydpxkw9qhjdxjpic1pdc2nirggyy6f-openssl-3.3.2
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/lygl27c44xv73kx1spskcgvzwq7z337c-openssl-3.3.2-bin
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/qq5q0alyzywdazhmybi7m69akz0ppk05-openssl-3.3.2-bin
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/kqm7wpqkzc4bwjlzqizcbz0mgkj06a9x-openssl-3.3.2-dev
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/pp2zf8bdgyz60ds8vcshk2603gcjgp72-openssl-3.3.2-dev
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/5yja5dpk2qw1v5mbfbl2d7klcdfrh90w-patch-2.7.6
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/srfxqk119fijwnprgsqvn68ys9kiw0bn-patchelf-0.15.0
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/3j1p598fivxs69wx3a657ysv3rw8k06l-pcre2-10.44
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/1i003ijlh9i0mzp6alqby5hg3090pjdx-perl-5.40.0
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/4ig84cyqi6qy4n0sanrbzsw1ixa497jx-stdenv-linux
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/d0gfdcag8bxzvg7ww4s7px4lf8sxisyx-stdenv-linux
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/d29r1bdmlvwmj52apgcdxfl1mm9c5782-update-autotools-gnu-config-scripts-hook
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/acfkqzj5qrqs88a4a6ixnybbjxja663d-xgcc-14-20241116-libgcc
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/c2njy6bv84kw1i4bjf5k5gn7gz8hn57n-xz-5.6.3
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/h18s640fnhhj2qdh5vivcfbxvz377srg-xz-5.6.3-bin
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/cqlaa2xf6lslnizyj9xqa8j0ii1yqw0x-zlib-1.3.1
2025-Sep-19 14:22:18.240197
#8 55.83   /nix/store/1lggwqzapn5mn49l9zy4h566ysv9kzdb-zlib-1.3.1-dev
2025-Sep-19 14:22:18.240197
#8 55.84 copying path '/nix/store/wf5zj2gbib3gjqllkabxaw4dh0gzcla3-builder.pl' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 55.85 copying path '/nix/store/17v0ywnr3akp85pvdi56gwl99ljv95kx-gcc-14-20241116-libgcc' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 55.85 copying path '/nix/store/1m67ipsk39xvhyqrxnzv2m2p48pil8kl-gnu-config-2024-01-01' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 55.85 copying path '/nix/store/acfkqzj5qrqs88a4a6ixnybbjxja663d-xgcc-14-20241116-libgcc' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 55.85 copying path '/nix/store/xcqcgqazykf6s7fsn08k0blnh0wisdcl-libunistring-1.3' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 55.85 copying path '/nix/store/fv7gpnvg922frkh81w5hkdhpz0nw3iiz-mirrors-list' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 55.85 copying path '/nix/store/pc74azbkr19rkd5bjalq2xwx86cj3cga-linux-headers-6.12' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 55.85 copying path '/nix/store/agvks3qmzja0yj54szi3vja6vx3cwkkw-curl-8.11.0-man' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 55.85 copying path '/nix/store/grixvx878884hy8x3xs0c0s1i00j632k-nghttp2-1.64.0' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 55.86 copying path '/nix/store/d29r1bdmlvwmj52apgcdxfl1mm9c5782-update-autotools-gnu-config-scripts-hook' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 55.89 copying path '/nix/store/34z2792zyd4ayl5186vx0s98ckdaccz9-libidn2-2.3.7' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 55.93 copying path '/nix/store/65h17wjrrlsj2rj540igylrx7fqcd6vq-glibc-2.40-36' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.15 copying path '/nix/store/a9jgnlhkjkxav6qrc3rzg2q84pkl2wvr-attr-2.5.2' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.15 copying path '/nix/store/a3c47r5z1q2c4rz0kvq8hlilkhx2s718-gawk-5.3.1' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.15 copying path '/nix/store/bpq1s72cw9qb2fs8mnmlw6hn2c7iy0ss-gcc-14-20241116-lib' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.15 copying path '/nix/store/5mh7kaj2fyv8mk4sfq1brwxgc02884wi-bash-5.2p37' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.15 copying path '/nix/store/ivl2v8rgg7qh1jkj5pwpqycax3rc2hnl-bzip2-1.0.8' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.15 copying path '/nix/store/74h4z8k82pmp24xryflv4lxkz8jlpqqd-ed-1.20.2' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.15 copying path '/nix/store/qbry6090vlr9ar33kdmmbq2p5apzbga8-expand-response-params' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.15 copying path '/nix/store/1c6bmxrrhm8bd26ai2rjqld2yyjrxhds-glibc-2.40-36-bin' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.15 copying path '/nix/store/kryrg7ds05iwcmy81amavk8w13y4lxbs-gmp-6.3.0' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.16 copying path '/nix/store/fp6cjl1zcmm6mawsnrb5yak1wkz2ma8l-gnumake-4.4.1' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.16 copying path '/nix/store/abm77lnrkrkb58z6xp1qwjcr1xgkcfwm-gnused-4.9' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.16 copying path '/nix/store/2wh1gqyzf5xsvxpdz2k0bxiz583wwq29-keyutils-1.6.3-lib' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.16 copying path '/nix/store/r9ac2hwnmb0nxwsrvr6gi9wsqf2whfqj-libuv-1.49.2' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.16 copying path '/nix/store/6cr0spsvymmrp1hj5n0kbaxw55w1lqyp-libxcrypt-4.4.36' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.16 copying path '/nix/store/qcghigzrz56vczwlzg9c02vbs6zr9jkz-nghttp2-1.64.0-lib' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.16 copying path '/nix/store/9l9n7a0v4aibcz0sgd0crs209an9p7dz-openssl-3.3.2' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.17 copying path '/nix/store/h1ydpxkw9qhjdxjpic1pdc2nirggyy6f-openssl-3.3.2' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.18 copying path '/nix/store/mglixp03lsp0w986svwdvm7vcy17rdax-bzip2-1.0.8-bin' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.22 copying path '/nix/store/3j1p598fivxs69wx3a657ysv3rw8k06l-pcre2-10.44' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.23 copying path '/nix/store/c2njy6bv84kw1i4bjf5k5gn7gz8hn57n-xz-5.6.3' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.23 copying path '/nix/store/cqlaa2xf6lslnizyj9xqa8j0ii1yqw0x-zlib-1.3.1' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.24 copying path '/nix/store/cf7gkacyxmm66lwl5nj6j6yykbrg4q5c-acl-2.3.2' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.24 copying path '/nix/store/dz97fw51rm5bl9kz1vg0haj1j1a7r1mr-nghttp2-1.64.0-dev' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.24 copying path '/nix/store/5yja5dpk2qw1v5mbfbl2d7klcdfrh90w-patch-2.7.6' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.24 copying path '/nix/store/ll14czvpxglf6nnwmmrmygplm830fvlv-libuv-1.49.2-dev' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.29 copying path '/nix/store/df2a8k58k00f2dh2x930dg6xs6g6mliv-binutils-2.43.1-lib' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.30 copying path '/nix/store/c4rj90r2m89rxs64hmm857mipwjhig5d-file-5.46' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.35 copying path '/nix/store/qs22aazzrdd4dnjf9vffl0n31hvls43h-mpfr-4.2.1' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.35 copying path '/nix/store/1lggwqzapn5mn49l9zy4h566ysv9kzdb-zlib-1.3.1-dev' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.35 copying path '/nix/store/xmbv8s4p4i4dbxgkgdrdfb0ym25wh6gk-isl-0.20' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.36 copying path '/nix/store/9cwwj1c9csmc85l2cqzs3h9hbf1vwl6c-gnutar-1.35' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.41 copying path '/nix/store/nvvj6sk0k6px48436drlblf4gafgbvzr-gzip-1.13' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.46 copying path '/nix/store/aap6cq56amx4mzbyxp2wpgsf1kqjcr1f-gnugrep-3.11' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.48 copying path '/nix/store/h18s640fnhhj2qdh5vivcfbxvz377srg-xz-5.6.3-bin' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.50 copying path '/nix/store/kj8hbqx4ds9qm9mq7hyikxyfwwg13kzj-glibc-2.40-36-dev' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 57.67 copying path '/nix/store/2a3anh8vl3fcgk0fvaravlimrqawawza-libmpc-1.3.1' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 58.30 copying path '/nix/store/j7p46r8v9gcpbxx89pbqlh61zhd33gzv-binutils-2.43.1' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 58.30 copying path '/nix/store/l89iqc7am6i60y8vk507zwrzxf0wcd3v-gcc-14-20241116' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 58.30 copying path '/nix/store/a2byxfv4lc8f2g5xfzw8cz5q8k05wi29-gmp-with-cxx-6.3.0' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 58.30 copying path '/nix/store/wwipgdqb4p2fr46kmw9c5wlk799kbl68-icu4c-74.2' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 58.30 copying path '/nix/store/srfxqk119fijwnprgsqvn68ys9kiw0bn-patchelf-0.15.0' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 58.39 copying path '/nix/store/v9c1s50x7magpiqgycxxkn36avzbcg0g-krb5-1.21.3-lib' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 58.39 copying path '/nix/store/8675pnfr4fqnwv4pzjl67hdwls4q13aa-libssh2-1.11.1' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 58.39 copying path '/nix/store/qq5q0alyzywdazhmybi7m69akz0ppk05-openssl-3.3.2-bin' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 58.47 copying path '/nix/store/lygl27c44xv73kx1spskcgvzwq7z337c-openssl-3.3.2-bin' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 58.55 copying path '/nix/store/4s9rah4cwaxflicsk5cndnknqlk9n4p3-coreutils-9.5' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 58.61 copying path '/nix/store/kqm7wpqkzc4bwjlzqizcbz0mgkj06a9x-openssl-3.3.2-dev' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 58.80 copying path '/nix/store/pp2zf8bdgyz60ds8vcshk2603gcjgp72-openssl-3.3.2-dev' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 58.93 copying path '/nix/store/jqrz1vq5nz4lnv9pqzydj0ir58wbjfy1-findutils-4.10.0' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 58.93 copying path '/nix/store/00g69vw7c9lycy63h45ximy0wmzqx5y6-diffutils-3.10' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 58.93 copying path '/nix/store/1i003ijlh9i0mzp6alqby5hg3090pjdx-perl-5.40.0' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 59.03 copying path '/nix/store/pkc7mb4a4qvyz73srkqh4mwl70w98dsv-curl-8.11.0' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 59.03 copying path '/nix/store/milph81dilrh96isyivh5n50agpx39k2-krb5-1.21.3' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 59.18 copying path '/nix/store/d7zhcrcc7q3yfbm3qkqpgc3daq82spwi-libssh2-1.11.1-dev' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 59.59 copying path '/nix/store/p123cq20klajcl9hj8jnkjip5nw6awhz-curl-8.11.0-bin' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 59.72 copying path '/nix/store/b56mswksrql15knpb1bnhv3ysif340kd-krb5-1.21.3-dev' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 59.73 copying path '/nix/store/4ig84cyqi6qy4n0sanrbzsw1ixa497jx-stdenv-linux' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 60.03 building '/nix/store/cjdjkmr6gy2h8l0cra71whgrvy030kx1-libraries.drv'...
2025-Sep-19 14:22:18.240197
#8 60.06 copying path '/nix/store/5f5linrxzhhb3mrclkwdpm9bd8ygldna-curl-8.11.0-dev' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 60.95 building '/nix/store/bs6g8vhkfynvlzidhlqbsvnc9wijbaaz-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv'...
2025-Sep-19 14:22:18.240197
#8 61.10 building '/nix/store/6vy68gykpxfphbmmyd59ya88xvrwvvaa-npm-9.9.4.tgz.drv'...
2025-Sep-19 14:22:18.240197
#8 61.42 copying path '/nix/store/srcmmqi8kxjfygd0hyy42c8hv6cws83b-binutils-wrapper-2.43.1' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 61.78
2025-Sep-19 14:22:18.240197
#8 61.79 trying https://registry.npmjs.org/npm/-/npm-9.9.4.tgz
2025-Sep-19 14:22:18.240197
#8 61.82   % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
2025-Sep-19 14:22:18.240197
#8 61.82                                  Dload  Upload   Total   Spent    Left  Speed
2025-Sep-19 14:22:18.240197
#8 62.08 100 2648k  100 2648k    0     0  9928k      0 --:--:-- --:--:-- --:--:--  9.9M
2025-Sep-19 14:22:18.240197
#8 62.44 copying path '/nix/store/m8w3mf0i4862q22bxad0wspkgdy4jnkk-icu4c-74.2-dev' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 62.78 copying path '/nix/store/wlpq101dsifq98z2bk300x4dk80wcybr-nodejs-18.20.5' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 67.51 copying path '/nix/store/xcn9p4xxfbvlkpah7pwchpav4ab9d135-gcc-wrapper-14-20241116' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 67.52 copying path '/nix/store/d0gfdcag8bxzvg7ww4s7px4lf8sxisyx-stdenv-linux' from 'https://cache.nixos.org'...
2025-Sep-19 14:22:18.240197
#8 67.56 building '/nix/store/w9h0z1lhfwxc0m38f3w5brfdqrzm4wyj-npm.drv'...
2025-Sep-19 14:22:18.240197
#8 67.67 Running phase: unpackPhase
2025-Sep-19 14:22:18.240197
#8 67.68 unpacking source archive /nix/store/fkd1ma3nify8r9wp463yg5rqz9hdcyf1-npm-9.9.4.tgz
2025-Sep-19 14:22:18.240197
#8 68.03 source root is package
2025-Sep-19 14:22:18.240197
#8 68.12 setting SOURCE_DATE_EPOCH to timestamp 499162500 of file package/package.json
2025-Sep-19 14:22:18.240197
#8 68.12 Running phase: installPhase
2025-Sep-19 14:22:18.240197
#8 69.68 building '/nix/store/9jwhwnx07rlarp2ancqq1cnwz1z7kzg0-ffeebf0acf3ae8b29f8c7049cd911b9636efd7e7-env.drv'...
2025-Sep-19 14:22:18.240197
#8 69.81 created 33 symlinks in user environment
2025-Sep-19 14:22:18.240197
#8 70.08 building '/nix/store/pcmy7zf39xpds576f4a9gkl4y2inxvxb-user-environment.drv'...
2025-Sep-19 14:22:18.240197
#8 70.34 removing old generations of profile /nix/var/nix/profiles/per-user/root/profile
2025-Sep-19 14:22:18.240197
#8 70.34 removing profile version 1
2025-Sep-19 14:22:18.240197
#8 70.34 removing old generations of profile /nix/var/nix/profiles/per-user/root/channels
2025-Sep-19 14:22:18.240197
#8 70.34 removing old generations of profile /nix/var/nix/profiles/per-user/root/profile
2025-Sep-19 14:22:18.240197
#8 70.35 removing old generations of profile /nix/var/nix/profiles/per-user/root/channels
2025-Sep-19 14:22:18.240197
#8 70.36 finding garbage collector roots...
2025-Sep-19 14:22:18.240197
#8 70.36 removing stale link from '/nix/var/nix/gcroots/auto/lzjbmb2ry0z7lma2fvpqprb12921pnb5' to '/nix/var/nix/profiles/per-user/root/profile-1-link'
2025-Sep-19 14:22:18.240197
#8 70.37 deleting garbage...
2025-Sep-19 14:22:18.240197
#8 70.43 deleting '/nix/store/a9qf4wwhympzs35ncp80r185j6a21w07-user-environment'
2025-Sep-19 14:22:18.240197
#8 70.44 deleting '/nix/store/253kwn1730vnay87xkjgxa2v97w3y079-user-environment.drv'
2025-Sep-19 14:22:18.240197
#8 70.44 deleting '/nix/store/hn5mrh362n52x8wwab9s1v6bgn4n5c94-env-manifest.nix'
2025-Sep-19 14:22:18.240197
#8 70.44 deleting '/nix/store/wf5zj2gbib3gjqllkabxaw4dh0gzcla3-builder.pl'
2025-Sep-19 14:22:18.240197
#8 70.45 deleting '/nix/store/d0gfdcag8bxzvg7ww4s7px4lf8sxisyx-stdenv-linux'
2025-Sep-19 14:22:18.240197
#8 70.45 deleting '/nix/store/4ig84cyqi6qy4n0sanrbzsw1ixa497jx-stdenv-linux'
2025-Sep-19 14:22:18.240197
#8 70.45 deleting '/nix/store/mglixp03lsp0w986svwdvm7vcy17rdax-bzip2-1.0.8-bin'
2025-Sep-19 14:22:18.240197
#8 70.45 deleting '/nix/store/lwi59jcfwk2lnrakmm1y5vw85hj3n1bi-source'
2025-Sep-19 14:22:18.240197
#8 76.39 deleting '/nix/store/xcn9p4xxfbvlkpah7pwchpav4ab9d135-gcc-wrapper-14-20241116'
2025-Sep-19 14:22:18.240197
#8 76.39 deleting '/nix/store/srcmmqi8kxjfygd0hyy42c8hv6cws83b-binutils-wrapper-2.43.1'
2025-Sep-19 14:22:18.240197
#8 76.39 deleting '/nix/store/j7p46r8v9gcpbxx89pbqlh61zhd33gzv-binutils-2.43.1'
2025-Sep-19 14:22:18.240197
#8 76.40 deleting '/nix/store/h18s640fnhhj2qdh5vivcfbxvz377srg-xz-5.6.3-bin'
2025-Sep-19 14:22:18.240197
#8 76.40 deleting '/nix/store/c2njy6bv84kw1i4bjf5k5gn7gz8hn57n-xz-5.6.3'
2025-Sep-19 14:22:18.240197
#8 76.40 deleting '/nix/store/5yja5dpk2qw1v5mbfbl2d7klcdfrh90w-patch-2.7.6'
2025-Sep-19 14:22:18.240197
#8 76.40 deleting '/nix/store/l89iqc7am6i60y8vk507zwrzxf0wcd3v-gcc-14-20241116'
2025-Sep-19 14:22:18.240197
#8 76.44 deleting '/nix/store/xmbv8s4p4i4dbxgkgdrdfb0ym25wh6gk-isl-0.20'
2025-Sep-19 14:22:18.240197
#8 76.44 deleting '/nix/store/2a3anh8vl3fcgk0fvaravlimrqawawza-libmpc-1.3.1'
2025-Sep-19 14:22:18.240197
#8 76.44 deleting '/nix/store/qs22aazzrdd4dnjf9vffl0n31hvls43h-mpfr-4.2.1'
2025-Sep-19 14:22:18.240197
#8 76.44 deleting '/nix/store/kryrg7ds05iwcmy81amavk8w13y4lxbs-gmp-6.3.0'
2025-Sep-19 14:22:18.240197
#8 76.44 deleting '/nix/store/srfxqk119fijwnprgsqvn68ys9kiw0bn-patchelf-0.15.0'
2025-Sep-19 14:22:18.240197
#8 76.44 deleting '/nix/store/5f5linrxzhhb3mrclkwdpm9bd8ygldna-curl-8.11.0-dev'
2025-Sep-19 14:22:18.240197
#8 76.44 deleting '/nix/store/d7zhcrcc7q3yfbm3qkqpgc3daq82spwi-libssh2-1.11.1-dev'
2025-Sep-19 14:22:18.240197
#8 76.44 deleting '/nix/store/ivl2v8rgg7qh1jkj5pwpqycax3rc2hnl-bzip2-1.0.8'
2025-Sep-19 14:22:18.240197
#8 76.44 deleting '/nix/store/p123cq20klajcl9hj8jnkjip5nw6awhz-curl-8.11.0-bin'
2025-Sep-19 14:22:18.240197
#8 76.44 deleting '/nix/store/pkc7mb4a4qvyz73srkqh4mwl70w98dsv-curl-8.11.0'
2025-Sep-19 14:22:18.240197
#8 76.44 deleting '/nix/store/kqm7wpqkzc4bwjlzqizcbz0mgkj06a9x-openssl-3.3.2-dev'
2025-Sep-19 14:22:18.240197
#8 76.44 deleting '/nix/store/qq5q0alyzywdazhmybi7m69akz0ppk05-openssl-3.3.2-bin'
2025-Sep-19 14:22:18.240197
#8 76.45 deleting '/nix/store/b56mswksrql15knpb1bnhv3ysif340kd-krb5-1.21.3-dev'
2025-Sep-19 14:22:18.240197
#8 76.45 deleting '/nix/store/milph81dilrh96isyivh5n50agpx39k2-krb5-1.21.3'
2025-Sep-19 14:22:18.240197
#8 76.45 deleting '/nix/store/v9c1s50x7magpiqgycxxkn36avzbcg0g-krb5-1.21.3-lib'
2025-Sep-19 14:22:18.240197
#8 76.45 deleting '/nix/store/8675pnfr4fqnwv4pzjl67hdwls4q13aa-libssh2-1.11.1'
2025-Sep-19 14:22:18.240197
#8 76.45 deleting '/nix/store/9l9n7a0v4aibcz0sgd0crs209an9p7dz-openssl-3.3.2'
2025-Sep-19 14:22:18.240197
#8 76.45 deleting '/nix/store/dz97fw51rm5bl9kz1vg0haj1j1a7r1mr-nghttp2-1.64.0-dev'
2025-Sep-19 14:22:18.240197
#8 76.45 deleting '/nix/store/qcghigzrz56vczwlzg9c02vbs6zr9jkz-nghttp2-1.64.0-lib'
2025-Sep-19 14:22:18.240197
#8 76.45 deleting '/nix/store/grixvx878884hy8x3xs0c0s1i00j632k-nghttp2-1.64.0'
2025-Sep-19 14:22:18.240197
#8 76.45 deleting '/nix/store/aap6cq56amx4mzbyxp2wpgsf1kqjcr1f-gnugrep-3.11'
2025-Sep-19 14:22:18.240197
#8 76.46 deleting '/nix/store/3j1p598fivxs69wx3a657ysv3rw8k06l-pcre2-10.44'
2025-Sep-19 14:22:18.240197
#8 76.46 deleting '/nix/store/d29r1bdmlvwmj52apgcdxfl1mm9c5782-update-autotools-gnu-config-scripts-hook'
2025-Sep-19 14:22:18.240197
#8 76.46 deleting '/nix/store/1m67ipsk39xvhyqrxnzv2m2p48pil8kl-gnu-config-2024-01-01'
2025-Sep-19 14:22:18.240197
#8 76.46 deleting '/nix/store/00g69vw7c9lycy63h45ximy0wmzqx5y6-diffutils-3.10'
2025-Sep-19 14:22:18.240197
#8 76.49 deleting '/nix/store/2wh1gqyzf5xsvxpdz2k0bxiz583wwq29-keyutils-1.6.3-lib'
2025-Sep-19 14:22:18.240197
#8 76.49 deleting '/nix/store/1i003ijlh9i0mzp6alqby5hg3090pjdx-perl-5.40.0'
2025-Sep-19 14:22:18.240197
#8 76.54 deleting '/nix/store/fkd1ma3nify8r9wp463yg5rqz9hdcyf1-npm-9.9.4.tgz'
2025-Sep-19 14:22:18.240197
#8 76.54 deleting '/nix/store/6cr0spsvymmrp1hj5n0kbaxw55w1lqyp-libxcrypt-4.4.36'
2025-Sep-19 14:22:18.240197
#8 76.54 deleting '/nix/store/nvvj6sk0k6px48436drlblf4gafgbvzr-gzip-1.13'
2025-Sep-19 14:22:18.240197
#8 76.54 deleting '/nix/store/jqrz1vq5nz4lnv9pqzydj0ir58wbjfy1-findutils-4.10.0'
2025-Sep-19 14:22:18.240197
#8 76.55 deleting '/nix/store/kj8hbqx4ds9qm9mq7hyikxyfwwg13kzj-glibc-2.40-36-dev'
2025-Sep-19 14:22:18.240197
#8 76.56 deleting '/nix/store/na4c03201p0gmhn3bqr089x0xqia157w-source'
2025-Sep-19 14:22:18.240197
#8 76.56 deleting '/nix/store/1c6bmxrrhm8bd26ai2rjqld2yyjrxhds-glibc-2.40-36-bin'
2025-Sep-19 14:22:18.240197
#8 76.56 deleting '/nix/store/fv7gpnvg922frkh81w5hkdhpz0nw3iiz-mirrors-list'
2025-Sep-19 14:22:18.240197
#8 76.56 deleting '/nix/store/df2a8k58k00f2dh2x930dg6xs6g6mliv-binutils-2.43.1-lib'
2025-Sep-19 14:22:18.240197
#8 76.56 deleting '/nix/store/c4rj90r2m89rxs64hmm857mipwjhig5d-file-5.46'
2025-Sep-19 14:22:18.240197
#8 76.56 deleting '/nix/store/agvks3qmzja0yj54szi3vja6vx3cwkkw-curl-8.11.0-man'
2025-Sep-19 14:22:18.240197
#8 76.56 deleting '/nix/store/1c0dv2pdlshjz5kmjd4dfp3c96yncr23-libraries'
2025-Sep-19 14:22:18.240197
#8 76.56 deleting '/nix/store/9cwwj1c9csmc85l2cqzs3h9hbf1vwl6c-gnutar-1.35'
2025-Sep-19 14:22:18.240197
#8 76.57 deleting '/nix/store/a3c47r5z1q2c4rz0kvq8hlilkhx2s718-gawk-5.3.1'
2025-Sep-19 14:22:18.240197
#8 76.57 deleting '/nix/store/abm77lnrkrkb58z6xp1qwjcr1xgkcfwm-gnused-4.9'
2025-Sep-19 14:22:18.240197
#8 76.57 deleting '/nix/store/74h4z8k82pmp24xryflv4lxkz8jlpqqd-ed-1.20.2'
2025-Sep-19 14:22:18.240197
#8 76.57 deleting '/nix/store/qbry6090vlr9ar33kdmmbq2p5apzbga8-expand-response-params'
2025-Sep-19 14:22:18.240197
#8 76.57 deleting '/nix/store/pc74azbkr19rkd5bjalq2xwx86cj3cga-linux-headers-6.12'
2025-Sep-19 14:22:18.240197
#8 76.59 deleting '/nix/store/fp6cjl1zcmm6mawsnrb5yak1wkz2ma8l-gnumake-4.4.1'
2025-Sep-19 14:22:18.240197
#8 76.60 deleting unused links...
2025-Sep-19 14:22:18.240197
#8 80.06 note: currently hard linking saves 1.72 MiB
2025-Sep-19 14:22:18.240197
#8 80.09 61 store paths deleted, 559.40 MiB freed
2025-Sep-19 14:22:18.240197
#8 DONE 80.3s
2025-Sep-19 14:22:18.240197
2025-Sep-19 14:22:18.240197
#9 [stage-0  5/13] RUN sudo apt-get update && sudo apt-get install -y --no-install-recommends curl wget
2025-Sep-19 14:22:18.240197
#9 0.358 Get:1 http://archive.ubuntu.com/ubuntu noble InRelease [256 kB]
2025-Sep-19 14:22:18.240197
#9 0.364 Get:2 http://security.ubuntu.com/ubuntu noble-security InRelease [126 kB]
2025-Sep-19 14:22:18.240197
#9 0.814 Get:3 http://security.ubuntu.com/ubuntu noble-security/restricted amd64 Packages [2306 kB]
2025-Sep-19 14:22:18.240197
#9 0.821 Get:4 http://archive.ubuntu.com/ubuntu noble-updates InRelease [126 kB]
2025-Sep-19 14:22:18.240197
#9 0.937 Get:5 http://archive.ubuntu.com/ubuntu noble-backports InRelease [126 kB]
2025-Sep-19 14:22:18.240197
#9 1.054 Get:6 http://archive.ubuntu.com/ubuntu noble/universe amd64 Packages [19.3 MB]
2025-Sep-19 14:22:18.240197
#9 1.288 Get:7 http://security.ubuntu.com/ubuntu noble-security/main amd64 Packages [1439 kB]
2025-Sep-19 14:22:18.240197
#9 1.324 Get:8 http://security.ubuntu.com/ubuntu noble-security/multiverse amd64 Packages [34.6 kB]
2025-Sep-19 14:22:18.240197
#9 1.327 Get:9 http://security.ubuntu.com/ubuntu noble-security/universe amd64 Packages [1136 kB]
2025-Sep-19 14:22:18.240197
#9 1.745 Get:10 http://archive.ubuntu.com/ubuntu noble/main amd64 Packages [1808 kB]
2025-Sep-19 14:22:18.240197
#9 1.776 Get:11 http://archive.ubuntu.com/ubuntu noble/multiverse amd64 Packages [331 kB]
2025-Sep-19 14:22:18.240197
#9 1.788 Get:12 http://archive.ubuntu.com/ubuntu noble/restricted amd64 Packages [117 kB]
2025-Sep-19 14:22:18.240197
#9 1.789 Get:13 http://archive.ubuntu.com/ubuntu noble-updates/universe amd64 Packages [1922 kB]
2025-Sep-19 14:22:18.240197
#9 1.827 Get:14 http://archive.ubuntu.com/ubuntu noble-updates/restricted amd64 Packages [2414 kB]
2025-Sep-19 14:22:18.240197
#9 1.879 Get:15 http://archive.ubuntu.com/ubuntu noble-updates/multiverse amd64 Packages [38.9 kB]
2025-Sep-19 14:22:18.240197
#9 1.883 Get:16 http://archive.ubuntu.com/ubuntu noble-updates/main amd64 Packages [1793 kB]
2025-Sep-19 14:22:18.240197
#9 1.919 Get:17 http://archive.ubuntu.com/ubuntu noble-backports/main amd64 Packages [48.8 kB]
2025-Sep-19 14:22:18.240197
#9 1.920 Get:18 http://archive.ubuntu.com/ubuntu noble-backports/universe amd64 Packages [35.6 kB]
2025-Sep-19 14:22:18.240197
#9 2.617 Fetched 33.4 MB in 2s (13.7 MB/s)
2025-Sep-19 14:22:18.240197
#9 2.617 Reading package lists...
2025-Sep-19 14:22:18.240197
#9 3.526 Reading package lists...
2025-Sep-19 14:22:18.240197
#9 4.519 Building dependency tree...
2025-Sep-19 14:22:18.240197
#9 4.743 Reading state information...
2025-Sep-19 14:22:18.240197
#9 5.066 curl is already the newest version (8.5.0-2ubuntu10.6).
2025-Sep-19 14:22:18.240197
#9 5.066 The following NEW packages will be installed:
2025-Sep-19 14:22:18.240197
#9 5.066   wget
2025-Sep-19 14:22:18.240197
#9 5.286 0 upgraded, 1 newly installed, 0 to remove and 38 not upgraded.
2025-Sep-19 14:22:18.240197
#9 5.286 Need to get 334 kB of archives.
2025-Sep-19 14:22:18.240197
#9 5.286 After this operation, 938 kB of additional disk space will be used.
2025-Sep-19 14:22:18.240197
#9 5.286 Get:1 http://archive.ubuntu.com/ubuntu noble-updates/main amd64 wget amd64 1.21.4-1ubuntu4.1 [334 kB]
2025-Sep-19 14:22:18.240197
#9 5.907 debconf: delaying package configuration, since apt-utils is not installed
2025-Sep-19 14:22:18.240197
#9 5.957 Fetched 334 kB in 1s (563 kB/s)
2025-Sep-19 14:22:18.240197
#9 5.988 Selecting previously unselected package wget.
2025-Sep-19 14:22:18.240197
#9 5.988 (Reading database ... 
(Reading database ... 5%
(Reading database ... 10%
(Reading database ... 15%
(Reading database ... 20%
(Reading database ... 25%
(Reading database ... 30%
(Reading database ... 35%
(Reading database ... 40%
(Reading database ... 45%
(Reading database ... 50%
(Reading database ... 55%
(Reading database ... 60%
(Reading database ... 65%
(Reading database ... 70%
(Reading database ... 75%
(Reading database ... 80%
(Reading database ... 85%
(Reading database ... 90%
(Reading database ... 95%
(Reading database ... 100%
(Reading database ... 9511 files and directories currently installed.)
2025-Sep-19 14:22:18.240197
#9 6.023 Preparing to unpack .../wget_1.21.4-1ubuntu4.1_amd64.deb ...
2025-Sep-19 14:22:18.240197
#9 6.026 Unpacking wget (1.21.4-1ubuntu4.1) ...
2025-Sep-19 14:22:18.240197
#9 6.069 Setting up wget (1.21.4-1ubuntu4.1) ...
2025-Sep-19 14:22:18.240197
#9 DONE 6.1s
2025-Sep-19 14:22:18.240197
2025-Sep-19 14:22:18.240197
#10 [stage-0  6/13] COPY . /app/.
2025-Sep-19 14:22:18.240197
#10 DONE 0.1s
2025-Sep-19 14:22:18.240197
2025-Sep-19 14:22:18.240197
#11 [stage-0  7/13] RUN  cd server && npm run ensure-main-accounts
2025-Sep-19 14:22:18.240197
#11 0.240 npm warn config production Use `--omit=dev` instead.
2025-Sep-19 14:22:18.240197
#11 0.241 npm warn config production Use `--omit=dev` instead.
2025-Sep-19 14:22:18.240197
#11 0.271
2025-Sep-19 14:22:18.240197
#11 0.271 > golden-horse-server@1.0.0 ensure-main-accounts
2025-Sep-19 14:22:18.240197
#11 0.271 > node src/scripts/ensureMainAccounts.js
2025-Sep-19 14:22:18.240197
#11 0.271
2025-Sep-19 14:22:18.240197
#11 0.333 node:internal/errors:496
2025-Sep-19 14:22:18.240197
#11 0.333     ErrorCaptureStackTrace(err);
2025-Sep-19 14:22:18.240197
#11 0.333     ^
2025-Sep-19 14:22:18.240197
#11 0.333
2025-Sep-19 14:22:18.240197
#11 0.333 Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'sequelize' imported from /app/server/src/models/index.js
2025-Sep-19 14:22:18.240197
#11 0.333     at new NodeError (node:internal/errors:405:5)
2025-Sep-19 14:22:18.240197
#11 0.333     at packageResolve (node:internal/modules/esm/resolve:916:9)
2025-Sep-19 14:22:18.240197
#11 0.333     at moduleResolve (node:internal/modules/esm/resolve:973:20)
2025-Sep-19 14:22:18.240197
#11 0.333     at defaultResolve (node:internal/modules/esm/resolve:1206:11)
2025-Sep-19 14:22:18.240197
#11 0.333     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:404:12)
2025-Sep-19 14:22:18.240197
#11 0.333     at ModuleLoader.resolve (node:internal/modules/esm/loader:373:25)
2025-Sep-19 14:22:18.240197
#11 0.333     at ModuleLoader.getModuleJob (node:internal/modules/esm/loader:250:38)
2025-Sep-19 14:22:18.240197
#11 0.333     at ModuleWrap.<anonymous> (node:internal/modules/esm/module_job:76:39)
2025-Sep-19 14:22:18.240197
#11 0.333     at link (node:internal/modules/esm/module_job:75:36) {
2025-Sep-19 14:22:18.240197
#11 0.333   code: 'ERR_MODULE_NOT_FOUND'
2025-Sep-19 14:22:18.240197
#11 0.333 }
2025-Sep-19 14:22:18.240197
#11 0.333
2025-Sep-19 14:22:18.240197
#11 0.333 Node.js v18.20.5
2025-Sep-19 14:22:18.240197
#11 ERROR: process "/bin/bash -ol pipefail -c cd server && npm run ensure-main-accounts" did not complete successfully: exit code: 1
2025-Sep-19 14:22:18.240197
------
2025-Sep-19 14:22:18.240197
> [stage-0  7/13] RUN  cd server && npm run ensure-main-accounts:
2025-Sep-19 14:22:18.240197
0.333     at defaultResolve (node:internal/modules/esm/resolve:1206:11)
2025-Sep-19 14:22:18.240197
0.333     at ModuleLoader.defaultResolve (node:internal/modules/esm/loader:404:12)
2025-Sep-19 14:22:18.240197
0.333     at ModuleLoader.resolve (node:internal/modules/esm/loader:373:25)
2025-Sep-19 14:22:18.240197
0.333     at ModuleLoader.getModuleJob (node:internal/modules/esm/loader:250:38)
2025-Sep-19 14:22:18.240197
0.333     at ModuleWrap.<anonymous> (node:internal/modules/esm/module_job:76:39)
2025-Sep-19 14:22:18.240197
0.333     at link (node:internal/modules/esm/module_job:75:36) {
2025-Sep-19 14:22:18.240197
0.333   code: 'ERR_MODULE_NOT_FOUND'
2025-Sep-19 14:22:18.240197
0.333 }
2025-Sep-19 14:22:18.240197
0.333
2025-Sep-19 14:22:18.240197
0.333 Node.js v18.20.5
2025-Sep-19 14:22:18.240197
------
2025-Sep-19 14:22:18.240197
2025-Sep-19 14:22:18.240197
1 warning found (use docker --debug to expand):
2025-Sep-19 14:22:18.240197
- UndefinedVar: Usage of undefined variable '$NIXPACKS_PATH' (line 22)
2025-Sep-19 14:22:18.240197
Dockerfile:19
2025-Sep-19 14:22:18.240197
--------------------
2025-Sep-19 14:22:18.240197
17 |     # setup-db phase
2025-Sep-19 14:22:18.240197
18 |     COPY . /app/.
2025-Sep-19 14:22:18.240197
19 | >>> RUN  cd server && npm run ensure-main-accounts
2025-Sep-19 14:22:18.240197
20 |
2025-Sep-19 14:22:18.240197
21 |     # install phase
2025-Sep-19 14:22:18.240197
--------------------
2025-Sep-19 14:22:18.240197
ERROR: failed to build: failed to solve: process "/bin/bash -ol pipefail -c cd server && npm run ensure-main-accounts" did not complete successfully: exit code: 1
2025-Sep-19 14:22:18.240197
exit status 1
2025-Sep-19 14:22:18.247567
Deployment failed. Removing the new version of your application.