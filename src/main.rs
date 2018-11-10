// extern crate htmlescape;
extern crate phf;
// extern crate regex;
extern crate time;

// use htmlescape::encode_minimal_w;
// use std::borrow::BorrowMut;
// use regex::Captures;
// use regex::Regex;
// use std::borrow::Cow;
use std::fs;
use time::PreciseTime;

// #[macro_use]
// extern crate lazy_static;

// include!(concat!(env!("OUT_DIR"), "/codegen.rs"));

// pub fn is_function(word: &str) -> bool {
//     FUNCTIONS.contains(word)
// }
// pub fn is_word(word: &str) -> bool {
//     KEYWORDS.contains(word)
// }

#[derive(PartialEq)]
enum Token {
    Unset,
    Word,
    Name,
    Symbol,
    Number,
    String,
    Hex,
    HexString,
    Function,
    System,
    Variable,
}

const _MYSQL: &str = "select`users`.`UserID` `id`,now(+6365)
from`users`
join`companies`using(`CompanyID`)
where`users`.`Email`='プログラマーズ>'
and`companies`.`NetworkID`=x'1541A488C87419F2'
and`companies`.`CompanyID`in(@@AdminCompanyIDs)
and`users`.`__Active`<>0.0 
and @i := -.232
order by`users`.`__Added`desc
limit 1;";

const _MYSQL2: &str = "select`lineitemtypes`.`LineItemTypeID`,ifnull(`lineitemtypes`.`PluralName`,
    `lineitemtypes`.`Name`)`PluralName`,ifnull(`networklineitemtypes`.`PluralName`,
    `networklineitemtypes`.`Name`)`NetworkPluralName`
from`lineitemtypes`
join`lineitems`using(`LineItemID`)
left join`networklineitemtypes`on`networklineitemtypes`.`NetworkID`=`unb64u`(
    'FUGkiMhy53I')
and`networklineitemtypes`.`LineItemTypeID`=`lineitemtypes`.`LineItemTypeID`
where`lineitemtypes`.`LineItemTypeID`=`unb64u`('FUGjIgIAlDI')
and`lineitems`.`__Active`=1 
and`lineitemtypes`.`__Active`=1;";

// fn mysql_format(mysql: &str) -> String {
//     let bytes = mysql.as_bytes();
//     let len = mysql.len();
//     let mut s = String::with_capacity(len * 8);
//     s.push_str("<pre>");
//     let mut cur_token = Token::Unset;
//     let mut prev_token = Token::Unset;
//     let mut token_start = 0usize;
//     let mut token_end = 0usize;
//     let mut escaped = false;
//     let mut quote = '\'';
//     let mut p = 0;
//     let mut prev_str = String::new();
//     let mut word = String::new();
//     let mut skip = 0u8;
//     let mut end_tag: &str = "";
//     let mut token_ready = false;
//     // let max_len = 80;
//     // let mut actual_len = s.len();
//     // // let mut actual_line_len = 0;
//     // let mut last_actual_pos = 0;
//     // // let mut visible_len = 0;
//     // let mut visible_line_len = 0;
//     // let mut last_visible_pos = 0;

//     for (i, b) in bytes.iter().enumerate() {
//         if skip != 0 {
//             skip -= 1;
//             continue;
//         }

//         macro_rules! push_html {
//             ($mand_1:expr) => {
//                 s.push_str($mand_1);
//                 // actual_len += $mand_1.len();
//                 // actual_line_len += $mand_1.len();
//             };
//         }

//         macro_rules! push_text {
//             ($mand_1:expr, $mand_2:expr) => {{
//                 // visible_len += $mand_1.len();
//                 // visible_line_len += $mand_1.len();
//                 if $mand_2 {
//                     push_html!(&encode_minimal($mand_1));
//                 } else {
//                     push_html!($mand_1);
//                 }
//             }};
//         }

//         macro_rules! push_newline {
//             () => {{
//                 push_html!(&format!("\n{}", " ".repeat(2 * p)));
//                 // visible_line_len = 0;
//             }};
//         }

//         // push a token to the formatted output
//         macro_rules! push_token {
//             () => {
//                 if prev_token != Token::Unset && prev_token != cur_token {
//                     push_html!(end_tag);
//                 }
//                 match cur_token {
//                     Token::Unset => {
//                         break;
//                     }
//                     Token::Word => {
//                         match prev_token {
//                             Token::Word
//                             | Token::Number
//                             | Token::Hex
//                             | Token::HexString
//                             | Token::System
//                             | Token::Variable => {
//                                 push_text!(" ", false);
//                             }
//                             _ => {}
//                         }
//                         match word.as_str() {
//                             "from" | "where" | "and" | "or" | "order" | "group" | "having"
//                             | "limit" | "straight_join" | "cross" | "natural" | "union" => {
//                                 push_newline!()
//                             }
//                             "left" | "right" => match prev_token {
//                                 Token::Word => match prev_str.as_str() {
//                                     "natural" => {}
//                                     _ => push_newline!(),
//                                 },
//                                 _ => push_newline!(),
//                             },
//                             "join" => match prev_token {
//                                 Token::Word => match prev_str.as_str() {
//                                     "inner" | "cross" | "outer" | "left" | "right"
//                                     | "natural" => {}
//                                     _ => push_newline!(),
//                                 },
//                                 _ => push_newline!(),
//                             },
//                             _ => {}
//                         }
//                         if prev_token != cur_token {
//                             push_html!("<b style=\"color:#1976d2\">");
//                         }
//                         push_text!(&word, false);
//                         end_tag = "</b>";
//                         prev_str = word.clone();
//                     }
//                     Token::Function => {
//                         match prev_token {
//                             Token::Word
//                             | Token::Number
//                             | Token::Hex
//                             | Token::HexString
//                             | Token::System
//                             | Token::Variable => {
//                                 push_text!(" ", false);
//                             }
//                             _ => {}
//                         }
//                         if prev_token != cur_token {
//                             push_html!("<span style=\"color:#d81b60\">");
//                         }
//                         push_text!(&word, false);
//                         end_tag = "</span>";
//                     }
//                     Token::String => {
//                         if prev_token != cur_token {
//                             push_html!("<span style=\"color:#2e7d32\">");
//                         }
//                         push_html!("'");
//                         if quote == '\'' {
//                             push_text!(&mysql[token_start..=token_end], true);
//                         } else {
//                             let q = &quote.to_string();
//                             push_text!(
//                                 &mysql[token_start..=token_end]
//                                     .replace(&format!("{}{}", "\\", q).to_owned(), q)
//                                     .replace("'", "\\'"),
//                                 true
//                             );
//                         }
//                         push_html!("'");
//                         end_tag = "</span>";
//                     }
//                     Token::Name => {
//                         match prev_token {
//                             Token::Name => {
//                                 push_text!(" ", false);
//                             }
//                             _ => {}
//                         }
//                         if prev_token != cur_token {
//                             push_html!("<span style=\"color:#795548\">");
//                         }
//                         push_text!(&format!("`{}`", &mysql[token_start..=token_end]), true);
//                         end_tag = "</span>";
//                     }
//                     Token::Number => {
//                         match prev_token {
//                             Token::Word
//                             | Token::Hex
//                             | Token::HexString
//                             | Token::System
//                             | Token::Variable => {
//                                 push_text!(" ", false);
//                             }
//                             _ => {}
//                         }
//                         if prev_token != cur_token {
//                             push_html!("<span style=\"color:#ce4800\">");
//                         }
//                         push_text!(&mysql[token_start..=token_end], false);
//                         end_tag = "</span>";
//                     }
//                     Token::Hex | Token::HexString => {
//                         match prev_token {
//                             Token::Word => {
//                                 push_text!(" ", false);
//                             }
//                             _ => {}
//                         }
//                         if prev_token != cur_token {
//                             push_html!(
//                                 "<span style=\"color:#673ab7;background-color:#f0f0f0\">"
//                             );
//                         }
//                         push_text!(&mysql[token_start..=token_end], false);
//                         end_tag = "</span>";
//                     }
//                     Token::Symbol => {
//                         if prev_token != cur_token {
//                             push_html!("<b>");
//                         }
//                         let b = bytes[i] as char;
//                         match b {
//                             '>' | '<' | '&' => push_text!(&b.to_string(), true),
//                             _ => push_text!(&b.to_string(), false),
//                         }
//                         // if b == ',' {
//                         //     last_actual_pos = actual_len;
//                         //     last_visible_pos = visible_line_len;
//                         // }
//                         end_tag = "</b>";
//                     }
//                     Token::System => {
//                         match prev_token {
//                             Token::Word
//                             | Token::Hex
//                             | Token::HexString
//                             | Token::System
//                             | Token::Variable
//                             | Token::Number => {
//                                 push_text!(" ", false);
//                             }
//                             _ => {}
//                         }
//                         if prev_token != cur_token {
//                             push_html!("<i style=\"color:#00838f\">");
//                         }
//                         push_text!(&mysql[token_start..=token_end], false);
//                         end_tag = "</i>";
//                     }
//                     Token::Variable => {
//                         match prev_token {
//                             Token::Word
//                             | Token::Hex
//                             | Token::HexString
//                             | Token::System
//                             | Token::Variable
//                             | Token::Number => {
//                                 push_text!(" ", false);
//                             }
//                             _ => {}
//                         }
//                         if prev_token != cur_token {
//                             push_html!("<span style=\"color:#757575\">");
//                         }
//                         push_text!(&mysql[token_start..=token_end], false);
//                         end_tag = "</span>";
//                     }
//                 }

//                 // if last_actual_pos != 0 && visible_line_len > max_len {
//                 //     last_actual_pos = 0;
//                 //     visible_line_len -= last_visible_pos;
//                 // }

//                 prev_token = cur_token;
//                 cur_token = Token::Unset;
//                 token_ready = false;
//             };
//         }

//         // make sure current byte is valid for cur_token
//         match cur_token {
//             Token::Unset => {}
//             Token::Word | Token::Function => match *b as char {
//                 'a'...'z' | 'A'...'Z' | '0'...'9' | '_' => {}
//                 _ => {
//                     token_end = i - 1;
//                     word = mysql[token_start..=token_end].to_ascii_lowercase();
//                     if *b as char == '(' {
//                         if is_function(&word) {
//                             cur_token = Token::Function;
//                         } else if !is_word(&word) {
//                             cur_token = Token::Name;
//                         }
//                     } else if !is_word(&word) {
//                         cur_token = Token::Name;
//                     }
//                     push_token!();
//                 }
//             },
//             Token::Number => match *b as char {
//                 '0'...'9' | '.' => {}
//                 _ => {
//                     token_end = i - 1;
//                     push_token!();
//                 }
//             },
//             Token::Name | Token::String => {
//                 if !escaped {
//                     match *b as char {
//                         b if b == quote => {
//                             token_end = i - 1;
//                             push_token!();
//                             continue;
//                         }
//                         '\\' => escaped = true,
//                         _ => {}
//                     }
//                 } else {
//                     escaped = false;
//                 }
//             }
//             Token::HexString => match *b as char {
//                 '\'' => {
//                     token_end = i;
//                     push_token!();
//                     continue;
//                 }
//                 _ => {}
//             },
//             Token::Symbol => {}
//             Token::Hex => match *b as char {
//                 'a'...'f' | 'A'...'F' | '0'...'9' => {}
//                 _ => {
//                     token_end = i - 1;
//                     push_token!();
//                 }
//             },
//             Token::System | Token::Variable => match *b as char {
//                 'a'...'z' | 'A'...'Z' | '0'...'9' | '_' => {}
//                 _ => {
//                     token_end = i - 1;
//                     push_token!();
//                 }
//             },
//         }

//         // Set token if we're currently unset
//         match cur_token {
//             Token::Unset => match *b as char {
//                 'a'...'z' | 'A'...'Z' => {
//                     match *b as char {
//                         'x' | 'X' => {
//                             if i + 1 < len {
//                                 let next_b = bytes[i + 1] as char;
//                                 if next_b == '\'' {
//                                     cur_token = Token::HexString;
//                                     token_start = i;
//                                     skip = 1;

//                                     token_ready = true;
//                                 }
//                             }
//                         }
//                         _ => {}
//                     }

//                     if !token_ready {
//                         cur_token = Token::Word;
//                         token_start = i;
//                     }
//                 }
//                 '`' => {
//                     cur_token = Token::Name;
//                     token_start = i + 1;
//                     quote = '`';
//                 }
//                 '\'' | '"' => {
//                     cur_token = Token::String;
//                     token_start = i + 1;
//                     quote = *b as char
//                 }
//                 '0'...'9' => {
//                     match *b as char {
//                         '0' => {
//                             if i + 1 < len {
//                                 let next_b = bytes[i + 1] as char;
//                                 if next_b == 'x' || next_b == 'X' {
//                                     cur_token = Token::Hex;
//                                     token_start = i;
//                                     skip = 1;

//                                     token_ready = true;
//                                 }
//                             }
//                         }
//                         _ => {}
//                     }

//                     if !token_ready {
//                         cur_token = Token::Number;
//                         token_start = i;
//                     }
//                 }
//                 '.' | '=' | ';' | '(' | ')' | '?' | '^' | '&' | '|' | '/' | '*' | '+' | '-'
//                 | ':' | '~' | '<' | '>' | '!' | '%' | ',' => {
//                     match *b as char {
//                         '(' => p += 1,
//                         ')' => p -= 1,
//                         '+' | '-' | '.' => {
//                             if i + 1 < len {
//                                 match bytes[i + 1] as char {
//                                     '0'...'9' | '.' => {
//                                         cur_token = Token::Number;
//                                         token_start = i;

//                                         token_ready = true;
//                                     }
//                                     _ => {}
//                                 }
//                             }
//                         }
//                         _ => {}
//                     }

//                     if !token_ready {
//                         cur_token = Token::Symbol;
//                         push_token!();
//                     }
//                 }
//                 c if c.is_whitespace() => {}
//                 '@' => {
//                     token_start = i;
//                     if i + 1 < len && bytes[i + 1] as char == '@' {
//                         cur_token = Token::System;
//                         skip = 1;
//                     } else {
//                         cur_token = Token::Variable;
//                     }
//                 }
//                 _ => {
//                     println!("Unexpected byte `{}` at pos {}", *b as char, i);
//                     break;
//                 }
//             },
//             _ => {}
//         }

//         if len == i + 1 {
//             token_end = i;
//             push_token!();
//         }
//     }
//     s.push_str("</pre>");

//     return s;
// }

fn mysql_format2(mysql: &str) -> String {
    let bs = mysql.as_bytes();
    let len = bs.len();
    let mut s = String::with_capacity(len * 10);
    s.push_str("<pre>");
    let mut i = 0usize;
    let mut start: usize;
    let mut prev_token = Token::Unset;
    let mut end_tag: &str = "";

    while i < len {
        macro_rules! next {
            () => {
                i += 1
            };
            ($n:expr) => {
                i += $n
            };
        }

        macro_rules! prev {
            () => {
                i -= 1
            };
        }

        macro_rules! push {
            ($c:expr) => {
                s.push($c);
            };
        }

        macro_rules! push_esc {
            ($b:expr) => {
                match $b {
                    b'<' => push_str!("&lt;"),
                    b'>' => push_str!("&gt;"),
                    b'&' => push_str!("&amp;"),
                    _ => push!($b as char),
                }
            };
        }

        macro_rules! push_str {
            ($s:expr) => {
                s.push_str($s);
            };
        }

        macro_rules! push_str_esc {
            ($s:expr) => {
                for b in $s.bytes() {
                    push_esc!(b);
                }
            };
        }

        macro_rules! check_end_tag {
            ($t:ident) => {
                match prev_token {
                    Token::$t => {}
                    _ => push_str!(end_tag),
                }
            };
            ($t:ident, $s:expr, $e:expr) => {
                check_end_tag!($t);

                if prev_token != Token::$t {
                    push_str!($s);
                }

                prev_token = Token::$t;

                end_tag = $e;
            };
        }

        macro_rules! check_prev_space {
            ($mand_1:ident) => {
                match prev_token {
                    Token::$mand_1 => {
                        push!(' ');
                    }
                    _ => {}
                }
            };
        }

        macro_rules! consume_until_esc {
            ($mand_1:expr) => {
                next!();
                while i < len {
                    match bs[i] {
                        $mand_1 => {
                            break;
                        }
                        b'\\' => next!(2),
                        _ => next!(),
                    }
                }
                next!();
            };
        }

        macro_rules! push_token_name {
            () => {
                check_end_tag!(Name, "<span style=\"color:#795548\">", "</span>");
                check_prev_space!(Name);

                push_str_esc!(&mysql[start..i]);
            };
        }

        macro_rules! push_token_string {
            () => {
                check_end_tag!(String, "<span style=\"color:#2e7d32\">", "</span>");

                push_str_esc!(&mysql[start..i]);
            };
        }

        match bs[i] {
            b'`' => {
                start = i;
                consume_until_esc!{b'`'};
                push_token_name!();
            }
            b'\'' => {
                start = i;
                consume_until_esc!{b'\''};
                push_token_string!();
            }
            // b'"' => {
            //     next!();
            //     start = i;
            //     consume_until_esc!{b'"'};
            //     push_token_string_dbl!();
            // }
            _ => {}
        }

        next!();
        if i == len {
            check_end_tag!(Unset);
        }
    }

    s.push_str("</pre>");
    return s;
}

fn main() {
    let start = PreciseTime::now();
    let s = mysql_format2(_MYSQL2);
    let end = PreciseTime::now();

    println!("{}", s);
    println!("Took {}", start.to(end));

    fs::write("debug.html", s).expect("Unable to write file");
}
