<?php


if($_POST["feedback"]) {


mail("tonyliunyc@hotmail.com", "Here is the subject line",


$_POST["insert your message here"]. "From: an@email.address");


}


?>