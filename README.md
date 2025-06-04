### What is this?

A lambda function that waits for a query string and responds with an opinionated formatted version with html syntax highlighting.

### Example

Take the following as input:

```sql
sELECT users.`UserID`id,now(+6365)
fRoM`users`
JOIN`companies`using(`CompanyID`) WHERE`users`.`Email`='プログ\'ラマーズ>'`companies`.`NetworkID`=x'1541A488C87419F2' and`companies`.`NetworkID`=0x1541A488C87419F2
and`companies`.`CompanyID`in(@@AdminCompanyIDs) and yeet.poop   in('') and`users`.`__Active`<>0.0 and @i := -.232 order by`users`.`__Added`desc limit 1;
```

Well that will spit back out something that looks like this

![](https://d159l1kvshziji.cloudfront.net/i/BUI3/M.png)


As you can see, this is how *I* like to format my queries, this certainly doesn't try to format them anything remotely close to how something like MySQL Workbench likes to format them (which is awful IMO).

### Browser Usage

Load `pkg/mysql_format.js` and its accompanying WebAssembly module. After the
script loads, call `wasm_bindgen().then(...)` to initialise the module and use
`mysqlFormat()` to format your queries.

```html
<script src="pkg/mysql_format.js"></script>
<script>
wasm_bindgen('pkg/mysql_format_bg.wasm').then(function () {
  const formatted = wasm_bindgen.mysqlFormat('select * from users;');
  console.log(formatted);
});
</script>
```

### Notes

Notice in this doc at the very beginning it says "127.0.0.1" and not "localhost". In my testing, localhost still has to do a look up of some sort and does actually add some measurable time to making requests to this server. Only downside is that if you jump to IPV6, we need to know what to change this to (localhost will work for both IPV6 and IPV4)

### For arm64 building on ubuntu
```shell
# set up rust
rustup target add aarch64-unknown-linux-gnu

# add arm64 depedencies
sudo apt install gcc-aarch64-linux-gnu
```

Then set this up in `~/.cargo/config`

```
[target.aarch64-unknown-linux-gnu]
linker = "aarch64-linux-gnu-gcc
```

build command
```shell
cargo build --release --target aarch64-unknown-linux-gnu
```

rename binary to bootstrap and zip to send to lambda
```shell
cp ./target/aarch64-unknown-linux-gnu/release/mysql-format ./bootstrap && zip lambda.zip bootstrap && rm bootstrap
```
