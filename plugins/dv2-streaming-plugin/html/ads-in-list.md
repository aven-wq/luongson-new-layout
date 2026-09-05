@html/socolive/trangchu.js:828 tôi muốn đan xen hiện quảng cáo trong match list 

<div class="dv2-qc-match-list-pc">
  <ins data-z="1149" data-revive-id="1718ffff6aff14155bf9e84ffb3a29ee"></ins>
  <ins data-z="1152" data-revive-id="1718ffff6aff14155bf9e84ffb3a29ee"></ins>
</div>
<div class="dv2-qc-match-list-mobile">
  <ins data-z="1149" data-revive-id="1718ffff6aff14155bf9e84ffb3a29ee"></ins>
  <ins data-z="1152" data-revive-id="1718ffff6aff14155bf9e84ffb3a29ee"></ins>
</div>


.dv2-qc-match-list-pc {
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: center;
  justify-content: center;
}

.dv2-qc-match-list-mobile {
  display: none;
}
@media (max-width: 768px) {
  .dv2-qc-match-list-pc {
    display: none;
  }
  .dv2-qc-match-list-mobile {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
    justify-content: center;
  }
}
